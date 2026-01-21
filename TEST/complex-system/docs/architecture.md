# FinanceHub - Enterprise Financial Platform

## Overview

FinanceHub is a B2B financial services platform that enables businesses to manage payments, invoicing, and financial reporting. The platform handles sensitive financial data and must comply with PCI-DSS, SOC2, and GDPR requirements.

## System Architecture

### High-Level Architecture

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    EXTERNAL ZONE                         │
                                    │                                                          │
                                    │   ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
                                    │   │ Web App  │  │Mobile App│  │  Partner APIs        │  │
                                    │   │ (React)  │  │(iOS/And) │  │  (B2B Integrations)  │  │
                                    │   └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
                                    │        │             │                    │              │
                                    └────────┼─────────────┼────────────────────┼──────────────┘
                                             │             │                    │
┌────────────────────────────────────────────┼─────────────┼────────────────────┼──────────────────────────────┐
│                                    DMZ     │             │                    │                              │
│                                            ▼             ▼                    ▼                              │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────────────────────────────┐             │
│  │  Cloudflare │───▶│                           AWS ALB + WAF                                 │             │
│  │     WAF     │    │                    (Rate Limiting, DDoS Protection)                     │             │
│  └─────────────┘    └─────────────────────────────────────────────────────────────────────────┘             │
│                                            │                                                                 │
└────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┘
                                             │
┌────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┐
│                              INTERNAL ZONE │                                                                 │
│                                            ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                      API GATEWAY (Kong)                                              │   │
│  │                          Authentication, Rate Limiting, Request Routing                              │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                    │                    │                    │                    │                         │
│                    ▼                    ▼                    ▼                    ▼                         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐      │
│  │    Auth Service      │ │   Payment Service    │ │   Invoice Service    │ │  Reporting Service   │      │
│  │    (Node.js)         │ │    (Go)              │ │    (Node.js)         │ │    (Python)          │      │
│  │                      │ │                      │ │                      │ │                      │      │
│  │ - User auth          │ │ - Payment processing │ │ - Invoice CRUD       │ │ - Report generation  │      │
│  │ - MFA                │ │ - Refunds            │ │ - PDF generation     │ │ - Data aggregation   │      │
│  │ - Session mgmt       │ │ - Transaction logs   │ │ - Email delivery     │ │ - Export (CSV, PDF)  │      │
│  │ - RBAC               │ │ - Fraud detection    │ │ - Recurring billing  │ │ - Scheduled reports  │      │
│  └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘      │
│             │                        │                        │                        │                   │
│             │                        │                        │                        │                   │
│             ▼                        ▼                        ▼                        ▼                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                     MESSAGE QUEUE (RabbitMQ)                                         │   │
│  │                               Async communication between services                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              DATA ZONE                                                       │
│                                                                                                              │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐       │
│  │   PostgreSQL         │ │   Redis Cluster      │ │   Elasticsearch      │ │   S3 (Documents)     │       │
│  │   (Primary DB)       │ │   (Sessions/Cache)   │ │   (Audit Logs)       │ │   (Invoices/Reports) │       │
│  │                      │ │                      │ │                      │ │                      │       │
│  │ - User data          │ │ - Session tokens     │ │ - Security events    │ │ - Generated PDFs     │       │
│  │ - Transactions       │ │ - Rate limit counters│ │ - Access logs        │ │ - Uploaded docs      │       │
│  │ - Invoices           │ │ - Temporary data     │ │ - Transaction logs   │ │ - Backups            │       │
│  │ - Audit trail        │ │                      │ │                      │ │                      │       │
│  │                      │ │ Encryption: TLS      │ │ Retention: 7 years   │ │ Encryption: AES-256  │       │
│  │ Encryption: AES-256  │ │                      │ │                      │ │                      │       │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘       │
│                                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         EXTERNAL INTEGRATIONS                                                 │
│                                                                                                               │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐        │
│  │   Stripe             │ │   Plaid              │ │   SendGrid           │ │   Twilio             │        │
│  │   (Payments)         │ │   (Bank Linking)     │ │   (Email)            │ │   (SMS/MFA)          │        │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘ └──────────────────────┘        │
│                                                                                                               │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐                                 │
│  │   Auth0              │ │   DataDog            │ │   PagerDuty          │                                 │
│  │   (SSO/Enterprise)   │ │   (Monitoring)       │ │   (Alerting)         │                                 │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘                                 │
│                                                                                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Trust Boundaries

### TB-1: Internet to DMZ
- **Crossing point**: Cloudflare WAF → AWS ALB
- **Controls required**: DDoS protection, IP reputation filtering, rate limiting, TLS 1.3

### TB-2: DMZ to Internal Zone
- **Crossing point**: AWS ALB → API Gateway
- **Controls required**: mTLS, request validation, authentication token verification

### TB-3: Internal Zone to Data Zone
- **Crossing point**: Services → Databases
- **Controls required**: Service-specific credentials, connection pooling, query parameterization, encryption at rest

### TB-4: Internal Zone to External Integrations
- **Crossing point**: Services → Third-party APIs
- **Controls required**: API key management (HashiCorp Vault), request signing, response validation, timeout handling

### TB-5: Partner API Access
- **Crossing point**: Partner systems → API Gateway
- **Controls required**: API key authentication, IP allowlisting, request quotas, webhook signature verification

## Data Classification

| Data Type | Classification | Storage | Encryption | Retention |
|-----------|---------------|---------|------------|-----------|
| User credentials | Restricted | PostgreSQL | bcrypt + AES-256 | Account lifetime |
| Payment card data | Restricted (PCI) | Stripe (tokenized) | Stripe handles | Per PCI-DSS |
| Bank account numbers | Restricted | Plaid (tokenized) | Plaid handles | Per agreement |
| Transaction history | Confidential | PostgreSQL | AES-256 | 7 years |
| Invoices | Confidential | PostgreSQL + S3 | AES-256 | 7 years |
| User PII (name, email) | Confidential | PostgreSQL | AES-256 | Account lifetime + 30 days |
| Session tokens | Internal | Redis | TLS in transit | 24 hours |
| Audit logs | Confidential | Elasticsearch | AES-256 | 7 years |
| API keys | Restricted | HashiCorp Vault | Vault encryption | Until rotated |

## Authentication & Authorization

### User Authentication
- Email/password with bcrypt hashing (cost factor 12)
- MFA via TOTP (Google Authenticator) or SMS (Twilio)
- Enterprise SSO via Auth0 (SAML 2.0, OIDC)
- Session management via Redis (24-hour expiry, sliding window)

### API Authentication
- JWT tokens (RS256, 1-hour expiry)
- Refresh tokens (7-day expiry, single use)
- API keys for partner integrations (scoped, rate-limited)

### Authorization Model
- Role-Based Access Control (RBAC)
- Roles: `admin`, `owner`, `accountant`, `viewer`
- Resource-level permissions (organization-scoped)
- Audit logging for all privileged actions

## Compliance Requirements

### PCI-DSS
- No card data storage (Stripe tokenization)
- Network segmentation
- Quarterly vulnerability scans
- Annual penetration testing

### SOC2 Type II
- Access controls
- Encryption at rest and in transit
- Audit logging
- Incident response procedures

### GDPR
- Data subject access requests
- Right to deletion
- Data portability
- Consent management
- 72-hour breach notification

## Existing Security Controls

### Network Security
- Cloudflare WAF with OWASP ruleset
- AWS WAF with custom rules
- VPC with private subnets
- Security groups (least privilege)
- No direct internet access from data zone

### Application Security
- Input validation (Joi/Zod schemas)
- Output encoding
- CSRF protection (double-submit cookie)
- Rate limiting per user/IP
- Request size limits

### Monitoring & Logging
- DataDog APM for all services
- Centralized logging to Elasticsearch
- Security event alerting via PagerDuty
- Failed login attempt monitoring
- Anomaly detection for transactions

## Deployment

- Kubernetes (EKS) for services
- GitOps via ArgoCD
- Secrets management via HashiCorp Vault
- Blue-green deployments
- Automated security scanning in CI/CD (Snyk, Trivy)
