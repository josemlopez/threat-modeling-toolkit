# Auth Service

## Overview

Handles user authentication, authorization, session management, and MFA.

## Technology Stack
- Runtime: Node.js 20 LTS
- Framework: Express.js
- Database: PostgreSQL (user data)
- Cache: Redis (sessions)
- External: Auth0 (SSO), Twilio (SMS MFA)

## Data Handled

| Data | Classification | Purpose |
|------|---------------|---------|
| Email addresses | Confidential (PII) | User identification |
| Password hashes | Restricted | Authentication |
| TOTP secrets | Restricted | MFA |
| Phone numbers | Confidential (PII) | SMS MFA |
| Session tokens | Internal | Session management |
| Refresh tokens | Restricted | Token refresh |
| Audit logs | Confidential | Compliance |

## Security Controls

### Password Security
- Bcrypt hashing with cost factor 12
- Minimum 12 characters
- Complexity requirements (upper, lower, number, special)
- Password history (last 5)
- Breach detection (HaveIBeenPwned API)

### Session Management
- Redis-backed sessions
- 24-hour session expiry
- Sliding window refresh
- Single session per device option
- Session invalidation on password change

### MFA Implementation
- TOTP (RFC 6238) via Google Authenticator
- SMS fallback via Twilio
- Recovery codes (10 single-use codes)
- MFA required for admin accounts
- MFA optional for standard users

### Brute Force Protection
- Account lockout after 5 failed attempts
- Exponential backoff (1min, 5min, 15min, 1hr)
- CAPTCHA after 3 failed attempts
- IP-based rate limiting

## Endpoints

### POST /auth/register
Creates new user account.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "SecureP@ssw0rd!",
  "name": "John Doe",
  "organizationName": "Acme Corp"
}
```

**Security checks:**
- Email format validation
- Password strength validation
- Check against breached passwords
- Rate limiting (5/min per IP)

### POST /auth/login
Authenticates user and issues tokens.

**Request:**
```json
{
  "email": "user@company.com",
  "password": "SecureP@ssw0rd!",
  "mfaCode": "123456"  // Optional, required if MFA enabled
}
```

**Security checks:**
- Constant-time password comparison
- Account lockout check
- MFA verification if enabled
- Audit log entry

**Response:**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "expiresIn": 3600,
  "mfaRequired": false
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Security checks:**
- Refresh token rotation (single use)
- Token binding to user agent
- Revocation check

### POST /auth/logout
Invalidates session and tokens.

**Actions:**
- Remove session from Redis
- Add tokens to blacklist
- Audit log entry

### POST /auth/forgot-password
Initiates password reset flow.

**Security checks:**
- Rate limiting (3/hour per email)
- No user enumeration (always return success)
- Token expires in 1 hour
- Single-use token

### POST /auth/mfa/enable
Enables MFA for user account.

**Flow:**
1. Generate TOTP secret
2. Return QR code for authenticator app
3. Require verification code to confirm
4. Generate recovery codes

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_recovery_codes TEXT[],
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

```
DATABASE_URL=postgresql://auth:***@db.internal:5432/auth
REDIS_URL=redis://redis.internal:6379
JWT_PRIVATE_KEY=<RSA private key>
JWT_PUBLIC_KEY=<RSA public key>
TWILIO_ACCOUNT_SID=***
TWILIO_AUTH_TOKEN=***
AUTH0_DOMAIN=company.auth0.com
AUTH0_CLIENT_ID=***
AUTH0_CLIENT_SECRET=***
HIBP_API_KEY=***
```

## Monitoring

- Failed login attempts → PagerDuty alert if >10/min
- Account lockouts → Slack notification
- MFA failures → Logged to Elasticsearch
- Session anomalies → DataDog alert
