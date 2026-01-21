# Test Case: Complex System (Security Expert Experience)

This test case demonstrates the **security expert experience** - a comprehensive enterprise financial platform with detailed security documentation.

## What's Included

```
complex-system/
├── docs/
│   ├── architecture.md     # Full system architecture with diagrams
│   ├── api-gateway.md      # Kong API Gateway configuration
│   ├── infrastructure.md   # AWS/K8s infrastructure details
│   └── services/
│       ├── auth-service.md    # Detailed auth service docs
│       └── payment-service.md # Payment service with PCI-DSS notes
└── src/
    ├── auth-service/
    │   └── auth.ts         # Full auth implementation
    └── payment-service/
        └── payments.go     # Payment processing with Stripe
```

## How to Test

From the `complex-system` directory:

```bash
# Initialize with full documentation
/tm-init --docs ./docs

# Run comprehensive threat analysis with attack trees
/tm-threats --framework stride --include-abuse

# Thorough control verification
/tm-verify --thorough --evidence

# Map to multiple compliance frameworks
/tm-compliance --framework owasp,soc2,pci-dss

# Generate detailed report
/tm-report --level detailed

# Or run complete analysis
/tm-full --docs ./docs --compliance owasp,soc2,pci-dss
```

## What Makes This Complex

### Trust Boundaries (5 defined)
1. Internet → DMZ (Cloudflare/WAF)
2. DMZ → Internal (ALB → API Gateway)
3. Internal → Data (Services → Databases)
4. Internal → External (Services → Third-party APIs)
5. Partner → API (B2B integrations)

### Data Classifications
- Restricted (credentials, tokens, API keys)
- Confidential (PII, transactions, invoices)
- Internal (sessions, cache data)

### Compliance Requirements
- PCI-DSS (payment processing)
- SOC2 Type II (access controls, audit logging)
- GDPR (data subject rights)

### External Integrations
- Stripe (payments)
- Plaid (bank linking)
- Auth0 (SSO)
- Twilio (SMS/MFA)
- SendGrid (email)

### Security Controls (Documented)
- MFA with TOTP and SMS
- Rate limiting with Redis
- Bcrypt password hashing (cost 12)
- JWT with RS256
- Webhook signature verification
- Fraud detection
- Comprehensive audit logging

## Expected Findings

### Assets (~15+)
- 4 microservices (auth, payment, invoice, reporting)
- 4 data stores (PostgreSQL, Redis, Elasticsearch, S3)
- 6 external integrations
- API Gateway
- Infrastructure components

### Threats (~40-50)
- Authentication threats (credential stuffing, session hijacking)
- Payment threats (fraud, tampering, repudiation)
- Data threats (exfiltration, injection)
- Integration threats (SSRF, webhook manipulation)
- Infrastructure threats (misconfig, DoS)

### Controls (~30+)
- Most should be VERIFIED with code evidence
- Some PARTIAL (coverage gaps)
- Few MISSING (for demonstration)

### Compliance Coverage
- OWASP Top 10: ~85%
- SOC2: ~90%
- PCI-DSS: High (tokenized payments)

## Complexity Level

- **Assets**: ~15-20
- **Data Flows**: ~30+
- **Trust Boundaries**: 5
- **Threats**: ~40-50
- **Time to analyze**: ~5-10 minutes

This represents an enterprise system where security experts need comprehensive analysis and compliance mapping.
