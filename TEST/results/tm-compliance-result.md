# Compliance Mapping Results

**Project:** TaskFlow
**Generated:** 2026-01-21
**Frameworks Analyzed:** OWASP Top 10 2021, SOC2 Trust Services

---

```
Compliance Mapping Complete
===========================

Frameworks Analyzed: 2

OWASP Top 10 2021:
  A01 Broken Access Control:     ██░░░░░░░░ 15%  (2 gaps) NON-COMPLIANT
  A02 Cryptographic Failures:    █████████░ 90%          COMPLIANT
  A03 Injection:                 ███████░░░ 70%  (1 gap) PARTIAL
  A04 Insecure Design:           ░░░░░░░░░░  0%  (2 gaps) NON-COMPLIANT
  A05 Security Misconfiguration: █████░░░░░ 50%  (1 gap) PARTIAL
  A06 Vulnerable Components:     ??????????  ?%          UNKNOWN
  A07 Authentication Failures:   █████░░░░░ 45%  (3 gaps) PARTIAL
  A08 Integrity Failures:        ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  A09 Logging Failures:          ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  A10 SSRF:                      ────────── N/A          NOT APPLICABLE
  ─────────────────────────────────────────────────────
  Overall: 52%

SOC2 Trust Services:
  CC6.1 Logical Access:          ████░░░░░░ 40%  (2 gaps) PARTIAL
  CC6.2 Authentication:          ████░░░░░░ 35%  (3 gaps) PARTIAL
  CC6.3 Access Restrictions:     ██░░░░░░░░ 20%  (2 gaps) NON-COMPLIANT
  CC6.6 System Boundaries:       ███████░░░ 70%  (1 gap) PARTIAL
  CC6.7 Transmission Integrity:  ██████████ 100%         COMPLIANT
  CC7.2 Change Management:       ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 48%

Total Gaps Affecting Compliance: 10
  Critical Priority: 3
  High Priority: 5
  Medium Priority: 2

Files Created:
  .threatmodel/state/compliance.json
  .threatmodel/reports/compliance-report.md

Next Steps:
  Run /tm-report to generate full risk report
```

---

## Executive Summary

| Framework | Compliance | Status | Target |
|-----------|------------|--------|--------|
| OWASP Top 10 2021 | 52% | Needs Improvement | 80% |
| SOC2 Trust Services | 48% | Needs Improvement | 70% |
| **Overall** | **50%** | **Needs Improvement** | **75%** |

### Key Findings

- **5 Non-Compliant** requirements across both frameworks
- **3 Critical Gaps** require immediate attention
- **Missing MFA** impacts A04, A07, CC6.2
- **No security logging** fails A09 and CC7.2
- **BOLA vulnerabilities** fail A01, CC6.1, CC6.3

---

## OWASP Top 10 2021 Detailed Analysis

### A01:2021 - Broken Access Control
**Status:** NON-COMPLIANT (15%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Elevation of Privilege, Information Disclosure |
| Related Threats | THREAT-003, THREAT-004 |
| Related Controls | control-007 (partial), control-010 (missing) |
| Gaps | GAP-001, GAP-002 |

**Evidence:**
- PARTIAL: User-scoped queries for GET /tasks
  ```javascript
  // src/routes/tasks.js:14
  'SELECT * FROM tasks WHERE user_id = $1'
  ```
- MISSING: Object-level authorization on PUT/DELETE

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-001 | PUT /tasks/:id lacks ownership check | Add `AND user_id = $N` |
| GAP-002 | DELETE /tasks/:id lacks ownership check | Add `AND user_id = $N` |

**Remediation Priority:** CRITICAL

---

### A02:2021 - Cryptographic Failures
**Status:** COMPLIANT (90%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Information Disclosure |
| Related Threats | THREAT-008 |
| Related Controls | control-001, control-005 |
| Gaps | None |

**Evidence:**
- IMPLEMENTED: bcrypt password hashing (cost 10)
  ```javascript
  // src/routes/auth.js:20
  const hashedPassword = await bcrypt.hash(password, 10);
  ```
- IMPLEMENTED: Secure reset tokens
  ```javascript
  // src/routes/auth.js:76
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  ```
- IMPLEMENTED: JWT signing (HS256)

**Note:** Consider upgrading to RS256 for key rotation capability.

---

### A03:2021 - Injection
**Status:** PARTIAL (70%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Tampering |
| Related Threats | THREAT-009 |
| Related Controls | control-004 (implemented), control-008 (partial) |
| Gaps | GAP-010 |

**Evidence:**
- IMPLEMENTED: Parameterized SQL queries
  ```javascript
  // All queries use $1, $2 placeholders
  'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)'
  ```
- PARTIAL: Basic input validation (presence only)

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-010 | No schema validation | Implement Zod/Joi |

---

### A04:2021 - Insecure Design
**Status:** NON-COMPLIANT (0%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Elevation of Privilege, Tampering |
| Related Threats | THREAT-005, THREAT-013 |
| Related Controls | control-011 (missing), control-012 (missing) |
| Gaps | GAP-004, GAP-005 |

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-004 | No MFA design | Implement TOTP-based MFA |
| GAP-005 | No CSRF protection | Add csurf middleware |

**Note:** Threat model creation addresses this going forward.

---

### A05:2021 - Security Misconfiguration
**Status:** PARTIAL (50%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Denial of Service, Information Disclosure |
| Related Threats | THREAT-002 |
| Related Controls | control-003 (implemented), control-009 (missing) |
| Gaps | GAP-003 |

**Evidence:**
- IMPLEMENTED: Rate limiting on login (5 req/15 min)
- MISSING: Rate limiting on forgot-password

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-003 | /forgot-password unprotected | Add loginLimiter |

**Remediation Priority:** HIGH (trivial fix)

---

### A06:2021 - Vulnerable and Outdated Components
**Status:** UNKNOWN (Not Assessed)

**Action Required:**
```bash
# Run dependency audit
npm audit

# Check for outdated packages
npm outdated

# Review package-lock.json for known vulnerabilities
```

---

### A07:2021 - Identification and Authentication Failures
**Status:** PARTIAL (45%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Spoofing |
| Related Threats | THREAT-001, THREAT-006, THREAT-007, THREAT-011, THREAT-013, THREAT-014 |
| Gaps | GAP-004, GAP-007, GAP-008 |

**Controls Assessment:**
| Control | Status | Evidence |
|---------|--------|----------|
| Password hashing | Implemented | bcrypt cost 10 |
| JWT authentication | Implemented | jwt.verify() |
| Login rate limiting | Implemented | 5 req/15 min |
| MFA | Missing | - |
| Account lockout | Missing | - |
| Password policy | Missing | - |

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-004 | No MFA | TOTP with authenticator |
| GAP-007 | No account lockout | Lock after 10 failures |
| GAP-008 | No password policy | Min 12 chars + complexity |

---

### A08:2021 - Software and Data Integrity Failures
**Status:** NON-COMPLIANT (0%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Tampering |
| Related Threats | THREAT-005 |
| Related Controls | control-011 (missing) |
| Gaps | GAP-005 |

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-005 | No CSRF protection | csurf or SameSite cookies |

**Note:** CI/CD pipeline security not assessed.

---

### A09:2021 - Security Logging and Monitoring Failures
**Status:** NON-COMPLIANT (0%)

| Aspect | Status |
|--------|--------|
| STRIDE Categories | Repudiation |
| Related Threats | THREAT-010 |
| Related Controls | control-013 (missing) |
| Gaps | GAP-006 |

**Gaps Detail:**
| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-006 | No security logging | winston/pino + SIEM |

**Events to Log:**
- Login success/failure
- Password reset requests
- Authorization failures
- Data modifications

---

### A10:2021 - Server-Side Request Forgery (SSRF)
**Status:** NOT APPLICABLE

No server-side URL fetching functionality identified in the codebase.

---

## SOC2 Trust Services Detailed Analysis

### CC6.1 - Logical and Physical Access Controls
**Status:** PARTIAL (40%)

| Related Threats | THREAT-001, THREAT-003, THREAT-004, THREAT-006 |
|-----------------|------------------------------------------------|
| Related Controls | control-002, control-007, control-010 |
| Gaps | GAP-001, GAP-002 |

**Evidence:**
- IMPLEMENTED: JWT-based access control
- PARTIAL: User-scoped queries (GET only)
- MISSING: Object-level authorization

---

### CC6.2 - System Access Authentication
**Status:** PARTIAL (35%)

| Related Threats | THREAT-001, THREAT-007, THREAT-011, THREAT-013 |
|-----------------|------------------------------------------------|
| Related Controls | control-001, control-003, control-012, control-014, control-015 |
| Gaps | GAP-004, GAP-007, GAP-008 |

**Evidence:**
- IMPLEMENTED: Password hashing, rate limiting
- MISSING: MFA, account lockout, password policy

---

### CC6.3 - Access Restriction and Privileges
**Status:** NON-COMPLIANT (20%)

| Related Threats | THREAT-003, THREAT-004 |
|-----------------|------------------------|
| Related Controls | control-007, control-010 |
| Gaps | GAP-001, GAP-002 |

**Evidence:**
- PARTIAL: Basic authentication check
- MISSING: Role-based access control
- MISSING: Object-level authorization

---

### CC6.6 - System Boundaries
**Status:** PARTIAL (70%)

| Related Threats | THREAT-009 |
|-----------------|------------|
| Related Controls | control-004, control-008 |
| Gaps | GAP-010 |

**Evidence:**
- IMPLEMENTED: Parameterized queries
- PARTIAL: Input validation

---

### CC6.7 - Transmission Integrity
**Status:** COMPLIANT (100%)

**Evidence:**
- HTTPS for all external communications
- PostgreSQL TLS connection

---

### CC7.2 - Change Management
**Status:** NON-COMPLIANT (0%)

| Related Threats | THREAT-010 |
|-----------------|------------|
| Related Controls | control-013 |
| Gaps | GAP-006 |

**Evidence:**
- MISSING: Audit logging
- NOT ASSESSED: Version control and deployment practices

---

## Gap-to-Compliance Mapping

| Gap ID | Severity | OWASP Requirements | SOC2 Criteria |
|--------|----------|-------------------|---------------|
| GAP-001 | Critical | A01 | CC6.1, CC6.3 |
| GAP-002 | Critical | A01 | CC6.1, CC6.3 |
| GAP-003 | High | A05 | - |
| GAP-004 | Critical | A04, A07 | CC6.2 |
| GAP-005 | Medium | A04, A08 | - |
| GAP-006 | High | A09 | CC7.2 |
| GAP-007 | High | A07 | CC6.2 |
| GAP-008 | High | A07 | CC6.2 |
| GAP-009 | Medium | - | - |
| GAP-010 | Medium | A03 | CC6.6 |

---

## Remediation Roadmap for Compliance

### Phase 1: Critical (Week 1) - Impact: +20% OWASP, +15% SOC2

| Priority | Gap | Fix | OWASP | SOC2 |
|----------|-----|-----|-------|------|
| 1 | GAP-001 | Add ownership to UPDATE | A01 | CC6.1, CC6.3 |
| 2 | GAP-002 | Add ownership to DELETE | A01 | CC6.1, CC6.3 |
| 3 | GAP-003 | Add rate limiter | A05 | - |

**Expected Compliance After Phase 1:**
- OWASP: 52% → ~72%
- SOC2: 48% → ~63%

### Phase 2: High (Weeks 2-4) - Impact: +15% OWASP, +12% SOC2

| Priority | Gap | Fix | OWASP | SOC2 |
|----------|-----|-----|-------|------|
| 4 | GAP-006 | Security logging | A09 | CC7.2 |
| 5 | GAP-008 | Password policy | A07 | CC6.2 |
| 6 | GAP-007 | Account lockout | A07 | CC6.2 |

**Expected Compliance After Phase 2:**
- OWASP: ~72% → ~87%
- SOC2: ~63% → ~75%

### Phase 3: Medium (Month 2-3) - Impact: +8% OWASP, +10% SOC2

| Priority | Gap | Fix | OWASP | SOC2 |
|----------|-----|-----|-------|------|
| 7 | GAP-004 | Implement MFA | A04, A07 | CC6.2 |
| 8 | GAP-005 | CSRF protection | A04, A08 | - |
| 9 | GAP-010 | Schema validation | A03 | CC6.6 |

**Expected Compliance After Phase 3:**
- OWASP: ~87% → ~95%
- SOC2: ~75% → ~85%

---

## Compliance Progress Visualization

### Current State
```
OWASP Top 10 2021:   █████░░░░░  52%  [Needs Improvement]
SOC2 Trust Services: █████░░░░░  48%  [Needs Improvement]
```

### After Phase 1 (Week 1)
```
OWASP Top 10 2021:   ███████░░░  72%  [Approaching Target]
SOC2 Trust Services: ██████░░░░  63%  [Approaching Target]
```

### After Phase 2 (Month 1)
```
OWASP Top 10 2021:   █████████░  87%  [Above Target]
SOC2 Trust Services: ████████░░  75%  [At Target]
```

### After Phase 3 (Month 3)
```
OWASP Top 10 2021:   ██████████  95%  [Excellent]
SOC2 Trust Services: █████████░  85%  [Good]
```

---

## Audit-Ready Documentation

### For OWASP Compliance Audit

**Compliant Areas:**
- A02: Cryptographic Failures - bcrypt, secure tokens
- A03: Injection (partial) - parameterized queries

**Evidence Locations:**
- Password hashing: `src/routes/auth.js:20`
- SQL parameterization: `src/routes/*.js` (all queries)
- JWT authentication: `src/middleware/auth.js:16`
- Rate limiting: `src/middleware/rateLimiter.js:4`

### For SOC2 Audit

**Compliant Areas:**
- CC6.7: Transmission Integrity - HTTPS everywhere

**Partial Compliance Evidence:**
- Authentication: JWT-based, password hashed
- Access Control: User-scoped queries (GET)

**Gaps Requiring Remediation:**
- Object-level authorization
- Security logging
- MFA implementation
