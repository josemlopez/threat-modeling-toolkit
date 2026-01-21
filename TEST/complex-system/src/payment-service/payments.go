package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/paymentintent"
	"github.com/stripe/stripe-go/v74/webhook"
)

type PaymentRequest struct {
	Amount          int64             `json:"amount" binding:"required,gt=0"`
	Currency        string            `json:"currency" binding:"required,oneof=usd eur gbp"`
	PaymentMethodID string            `json:"paymentMethodId" binding:"required"`
	Description     string            `json:"description"`
	Metadata        map[string]string `json:"metadata"`
	IdempotencyKey  string            `json:"idempotencyKey" binding:"required"`
}

type RefundRequest struct {
	Amount int64  `json:"amount" binding:"required,gt=0"`
	Reason string `json:"reason" binding:"required,oneof=customer_request duplicate fraudulent"`
}

// CreatePayment handles payment creation
// @Security BearerAuth
// @Router /payments [post]
func (h *PaymentHandler) CreatePayment(c *gin.Context) {
	var req PaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "details": err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	user := c.MustGet("user").(User)

	// Check organization payment limits
	if err := h.checkPaymentLimits(user.OrganizationID, req.Amount); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "PAYMENT_LIMIT_EXCEEDED"})
		return
	}

	// Verify payment method belongs to organization
	if err := h.verifyPaymentMethodOwnership(req.PaymentMethodID, user.OrganizationID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "PAYMENT_METHOD_NOT_FOUND"})
		return
	}

	// Calculate fraud score
	fraudScore := h.calculateFraudScore(user, req)
	if fraudScore > 0.8 {
		h.auditLog.Log(AuditEntry{
			Action:         "PAYMENT_FLAGGED_FRAUD",
			UserID:         user.ID,
			OrganizationID: user.OrganizationID,
			Metadata:       map[string]interface{}{"fraudScore": fraudScore, "amount": req.Amount},
		})
		c.JSON(http.StatusForbidden, gin.H{"error": "PAYMENT_REQUIRES_REVIEW"})
		return
	}

	// Create Stripe payment intent
	params := &stripe.PaymentIntentParams{
		Amount:        stripe.Int64(req.Amount),
		Currency:      stripe.String(req.Currency),
		PaymentMethod: stripe.String(req.PaymentMethodID),
		Confirm:       stripe.Bool(true),
		Description:   stripe.String(req.Description),
		Metadata:      req.Metadata,
	}
	params.SetIdempotencyKey(req.IdempotencyKey)

	pi, err := paymentintent.New(params)
	if err != nil {
		h.logger.Error("Stripe error", "error", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "PAYMENT_FAILED"})
		return
	}

	// Store payment record
	payment := Payment{
		ID:                    uuid.New(),
		OrganizationID:        user.OrganizationID,
		UserID:                user.ID,
		Amount:                req.Amount,
		Currency:              req.Currency,
		Status:                string(pi.Status),
		StripePaymentIntentID: pi.ID,
		Description:           req.Description,
		Metadata:              req.Metadata,
		IdempotencyKey:        req.IdempotencyKey,
		FraudScore:            fraudScore,
		CreatedAt:             time.Now(),
	}

	if err := h.db.Create(&payment).Error; err != nil {
		h.logger.Error("Database error", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SERVER_ERROR"})
		return
	}

	h.auditLog.Log(AuditEntry{
		Action:         "PAYMENT_CREATED",
		UserID:         user.ID,
		OrganizationID: user.OrganizationID,
		ResourceType:   "payment",
		ResourceID:     payment.ID.String(),
		Metadata:       map[string]interface{}{"amount": req.Amount, "currency": req.Currency},
	})

	c.JSON(http.StatusCreated, payment)
}

// CreateRefund handles refund requests
// @Security BearerAuth
// @Router /payments/{id}/refund [post]
func (h *PaymentHandler) CreateRefund(c *gin.Context) {
	paymentID := c.Param("id")
	user := c.MustGet("user").(User)

	var req RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
		return
	}

	// Get payment and verify ownership
	var payment Payment
	if err := h.db.Where("id = ? AND organization_id = ?", paymentID, user.OrganizationID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PAYMENT_NOT_FOUND"})
		return
	}

	// Check refund amount doesn't exceed original
	totalRefunded := h.getTotalRefunded(payment.ID)
	if totalRefunded+req.Amount > payment.Amount {
		c.JSON(http.StatusBadRequest, gin.H{"error": "REFUND_EXCEEDS_PAYMENT"})
		return
	}

	// Check refund window (90 days)
	if time.Since(payment.CreatedAt) > 90*24*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{"error": "REFUND_WINDOW_EXPIRED"})
		return
	}

	// Require admin role for refunds
	if user.Role != "admin" && user.Role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "INSUFFICIENT_PERMISSIONS"})
		return
	}

	// Create Stripe refund
	refundParams := &stripe.RefundParams{
		PaymentIntent: stripe.String(payment.StripePaymentIntentID),
		Amount:        stripe.Int64(req.Amount),
	}

	stripeRefund, err := refund.New(refundParams)
	if err != nil {
		h.logger.Error("Stripe refund error", "error", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "REFUND_FAILED"})
		return
	}

	// Store refund record
	refundRecord := Refund{
		ID:             uuid.New(),
		PaymentID:      payment.ID,
		Amount:         req.Amount,
		Reason:         req.Reason,
		StripeRefundID: stripeRefund.ID,
		Status:         string(stripeRefund.Status),
		CreatedBy:      user.ID,
		CreatedAt:      time.Now(),
	}

	if err := h.db.Create(&refundRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SERVER_ERROR"})
		return
	}

	h.auditLog.Log(AuditEntry{
		Action:         "REFUND_CREATED",
		UserID:         user.ID,
		OrganizationID: user.OrganizationID,
		ResourceType:   "refund",
		ResourceID:     refundRecord.ID.String(),
		Metadata:       map[string]interface{}{"amount": req.Amount, "paymentId": paymentID},
	})

	c.JSON(http.StatusCreated, refundRecord)
}

// HandleStripeWebhook processes Stripe webhook events
// @Router /webhooks/stripe [post]
func (h *PaymentHandler) HandleStripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_PAYLOAD"})
		return
	}

	// Verify webhook signature
	sig := c.GetHeader("Stripe-Signature")
	webhookSecret, err := h.vault.Read("secret/data/stripe", "webhook_secret")
	if err != nil {
		h.logger.Error("Vault error", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SERVER_ERROR"})
		return
	}

	event, err := webhook.ConstructEvent(payload, sig, webhookSecret)
	if err != nil {
		h.logger.Warn("Invalid webhook signature", "error", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_SIGNATURE"})
		return
	}

	// Handle event types
	switch event.Type {
	case "payment_intent.succeeded":
		h.handlePaymentSucceeded(event)
	case "payment_intent.payment_failed":
		h.handlePaymentFailed(event)
	case "charge.refunded":
		h.handleChargeRefunded(event)
	case "charge.dispute.created":
		h.handleDisputeCreated(event)
	default:
		h.logger.Info("Unhandled webhook event", "type", event.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// Helper functions

func (h *PaymentHandler) calculateFraudScore(user User, req PaymentRequest) float64 {
	score := 0.0

	// Check velocity (transactions in last hour)
	count := h.getRecentTransactionCount(user.ID, time.Hour)
	if count > 5 {
		score += 0.3
	}

	// Check amount anomaly
	avgAmount := h.getAverageTransactionAmount(user.OrganizationID)
	if req.Amount > avgAmount*3 {
		score += 0.3
	}

	// Check geographic anomaly
	if h.isNewLocation(user.ID, h.getCurrentLocation()) {
		score += 0.2
	}

	return score
}

func (h *PaymentHandler) verifyPaymentMethodOwnership(pmID string, orgID uuid.UUID) error {
	// Verify the payment method is associated with this organization's Stripe customer
	var customer Customer
	if err := h.db.Where("organization_id = ?", orgID).First(&customer).Error; err != nil {
		return err
	}

	pm, err := paymentmethod.Get(pmID, nil)
	if err != nil {
		return err
	}

	if pm.Customer.ID != customer.StripeCustomerID {
		return fmt.Errorf("payment method does not belong to organization")
	}

	return nil
}
