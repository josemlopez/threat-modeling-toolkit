# API Gateway Configuration (Kong)

## Overview

Kong API Gateway handles all incoming requests, providing authentication, rate limiting, and request routing.

## Endpoints

### Public Endpoints (No Auth)
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/health
GET  /api/v1/docs
```

### Protected Endpoints (JWT Required)
```
# User Management
GET    /api/v1/users/me
PUT    /api/v1/users/me
DELETE /api/v1/users/me
POST   /api/v1/users/me/mfa/enable
POST   /api/v1/users/me/mfa/verify

# Organizations
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:orgId
PUT    /api/v1/organizations/:orgId
DELETE /api/v1/organizations/:orgId

# Payments
POST   /api/v1/payments
GET    /api/v1/payments/:paymentId
POST   /api/v1/payments/:paymentId/refund
GET    /api/v1/payments/history

# Invoices
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/:invoiceId
PUT    /api/v1/invoices/:invoiceId
DELETE /api/v1/invoices/:invoiceId
POST   /api/v1/invoices/:invoiceId/send
GET    /api/v1/invoices/:invoiceId/pdf

# Reports
GET    /api/v1/reports
POST   /api/v1/reports/generate
GET    /api/v1/reports/:reportId
GET    /api/v1/reports/:reportId/download
```

### Admin Endpoints (Admin Role Required)
```
GET    /api/v1/admin/users
PUT    /api/v1/admin/users/:userId/role
DELETE /api/v1/admin/users/:userId
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/security-events
POST   /api/v1/admin/api-keys
DELETE /api/v1/admin/api-keys/:keyId
```

### Partner API Endpoints (API Key Required)
```
POST   /api/v1/partner/webhooks/register
DELETE /api/v1/partner/webhooks/:webhookId
POST   /api/v1/partner/payments
GET    /api/v1/partner/payments/:paymentId
POST   /api/v1/partner/invoices
GET    /api/v1/partner/invoices/:invoiceId
```

### Webhook Receivers
```
POST   /webhooks/stripe         # Stripe payment events
POST   /webhooks/plaid          # Plaid bank events
POST   /webhooks/auth0          # Auth0 user events
```

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| Password reset | 3 requests | 1 hour |
| API (authenticated) | 1000 requests | 1 minute |
| API (partner) | 10000 requests | 1 minute |
| Report generation | 10 requests | 1 hour |
| File upload | 20 requests | 1 hour |

## Request Validation

- Maximum request body: 10MB
- Maximum URL length: 2048 characters
- Required headers: `Content-Type`, `Authorization` (for protected routes)
- Allowed content types: `application/json`, `multipart/form-data`

## Response Headers

```
X-Request-ID: <uuid>
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <timestamp>
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

## Service Routing

| Path Prefix | Service | Port |
|-------------|---------|------|
| /api/v1/auth/* | auth-service | 3001 |
| /api/v1/users/* | auth-service | 3001 |
| /api/v1/payments/* | payment-service | 3002 |
| /api/v1/invoices/* | invoice-service | 3003 |
| /api/v1/reports/* | reporting-service | 3004 |
| /api/v1/admin/* | auth-service | 3001 |
| /api/v1/partner/* | payment-service | 3002 |
| /webhooks/* | webhook-processor | 3005 |
