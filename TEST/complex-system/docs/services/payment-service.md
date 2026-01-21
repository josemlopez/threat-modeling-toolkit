# Payment Service

## Overview

Handles payment processing, refunds, and transaction management. Integrates with Stripe for card payments and Plaid for bank account linking.

## Technology Stack
- Runtime: Go 1.21
- Framework: Gin
- Database: PostgreSQL (transactions)
- Queue: RabbitMQ (async processing)
- External: Stripe, Plaid

## PCI-DSS Compliance

**Critical: This service does NOT store, process, or transmit raw card data.**

All card operations are tokenized via Stripe:
- Card numbers → Stripe tokens
- Bank accounts → Plaid tokens
- We only store token references

## Data Handled

| Data | Classification | Storage |
|------|---------------|---------|
| Stripe payment tokens | Internal | PostgreSQL |
| Plaid access tokens | Restricted | HashiCorp Vault |
| Transaction amounts | Confidential | PostgreSQL |
| Transaction metadata | Confidential | PostgreSQL |
| Merchant IDs | Internal | PostgreSQL |
| Webhook secrets | Restricted | HashiCorp Vault |

## Security Controls

### Payment Authorization
- JWT validation via API Gateway
- Organization-level permissions
- Amount limits per user role
- Velocity checks (max transactions/hour)
- Duplicate payment detection

### Stripe Integration
- API keys stored in Vault
- Webhook signature verification (Stripe-Signature header)
- Idempotency keys for all requests
- TLS 1.3 for all API calls

### Plaid Integration
- Access tokens encrypted at rest
- Item-level access control
- Webhook verification
- Token refresh handling

### Fraud Detection
- Velocity checks (>5 transactions/minute = flag)
- Amount anomaly detection (>3x average = review)
- Geographic anomaly (new country = MFA required)
- Device fingerprinting

## Endpoints

### POST /payments
Create a new payment.

**Request:**
```json
{
  "amount": 10000,  // in cents
  "currency": "usd",
  "paymentMethodId": "pm_xxx",  // Stripe payment method
  "description": "Invoice #123",
  "metadata": {
    "invoiceId": "inv_abc123"
  }
}
```

**Security checks:**
- Amount validation (positive, within limits)
- Currency validation (allowed currencies)
- Payment method ownership verification
- Idempotency key required
- Fraud score calculation

**Response:**
```json
{
  "id": "pay_abc123",
  "status": "succeeded",
  "amount": 10000,
  "currency": "usd",
  "stripePaymentIntentId": "pi_xxx",
  "createdAt": "2025-01-20T10:00:00Z"
}
```

### POST /payments/:id/refund
Refund a payment (full or partial).

**Request:**
```json
{
  "amount": 5000,  // partial refund in cents
  "reason": "customer_request"
}
```

**Security checks:**
- Admin or owner role required
- Amount <= original payment
- Within refund window (90 days)
- Audit log entry
- Webhook notification to customer

### POST /payments/bank-account
Link a bank account via Plaid.

**Request:**
```json
{
  "publicToken": "public-xxx",  // From Plaid Link
  "accountId": "acc_xxx"
}
```

**Security checks:**
- Token exchange via server-side
- Account ownership verification
- MFA required for first link
- Webhook registration

### GET /payments/history
Get transaction history.

**Query params:**
- `startDate`, `endDate` (required)
- `status` (optional)
- `limit`, `offset` (pagination)

**Security checks:**
- Organization-scoped results
- Date range max 1 year
- Audit log for large exports

## Webhook Handlers

### POST /webhooks/stripe
Handles Stripe events.

**Handled events:**
- `payment_intent.succeeded`
- `payment_intent.failed`
- `charge.refunded`
- `charge.dispute.created`

**Security:**
```go
// Verify Stripe signature
sig := r.Header.Get("Stripe-Signature")
event, err := webhook.ConstructEvent(body, sig, webhookSecret)
```

### POST /webhooks/plaid
Handles Plaid events.

**Handled events:**
- `TRANSACTIONS_REMOVED`
- `ITEM_ERROR`
- `PENDING_EXPIRATION`

**Security:**
- Verification token validation
- IP allowlist for Plaid servers

## Database Schema

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  description TEXT,
  metadata JSONB,
  idempotency_key VARCHAR(255) UNIQUE,
  fraud_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  amount BIGINT NOT NULL,
  reason VARCHAR(100),
  stripe_refund_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plaid_item_id VARCHAR(255) NOT NULL,
  plaid_account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_mask VARCHAR(4),
  institution_name VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plaid tokens stored in Vault, not here
```

## Environment Variables

```
DATABASE_URL=postgresql://payment:***@db.internal:5432/payments
RABBITMQ_URL=amqp://rabbitmq.internal:5672
VAULT_ADDR=https://vault.internal:8200
STRIPE_SECRET_KEY=vault:secret/data/stripe#secret_key
STRIPE_WEBHOOK_SECRET=vault:secret/data/stripe#webhook_secret
PLAID_CLIENT_ID=vault:secret/data/plaid#client_id
PLAID_SECRET=vault:secret/data/plaid#secret
PLAID_ENV=production
```

## Monitoring & Alerting

- Payment failures >5% → PagerDuty P1
- Refund rate >10% → Slack alert
- Fraud score >0.8 → Manual review queue
- Stripe API errors → DataDog alert
- Webhook delivery failures → Retry with backoff
