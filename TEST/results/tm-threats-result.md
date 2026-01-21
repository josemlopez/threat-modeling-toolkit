# Threat Analysis Results

**Project:** TaskFlow
**Framework:** STRIDE
**Generated:** 2026-01-21

---

```
Threat Analysis Complete
========================

Framework: STRIDE
Assets Analyzed: 5
Attack Surfaces Analyzed: 8
Data Flows Analyzed: 8

Threats Identified:
  Critical: 4
  High:     7
  Medium:   4
  Low:      0
  ─────────
  Total:   15

Top Critical Threats:
  1. [THREAT-001] Credential Stuffing Attack (Risk: 16)
  2. [THREAT-003] BOLA - Task Update (Risk: 16)
  3. [THREAT-004] BOLA - Task Delete (Risk: 16)
  4. [THREAT-013] Missing MFA (Risk: 16)

Attack Trees Generated: 5
Risk Register Entries: 15

Files Updated:
  .threatmodel/state/threats.json
  .threatmodel/state/attack-trees.json
  .threatmodel/state/risk-register.json

Next Steps:
  Run /tm-verify to check control implementations
```

---

## Threat Catalog

### Critical Threats (Risk Score 16-25)

#### THREAT-001: Credential Stuffing Attack
| Attribute | Value |
|-----------|-------|
| **Category** | Spoofing |
| **Target** | POST /api/auth/login |
| **Threat Actor** | External Attacker |
| **Risk Score** | 16 (Critical) |
| **Likelihood** | 4 - Likely |
| **Impact** | 4 - Major |

**Description:** Attacker uses leaked credentials from other breaches to gain unauthorized access to user accounts. Rate limiting exists but may be insufficient for distributed attacks.

**Prerequisites:**
- Leaked credential database
- Knowledge of login endpoint

**Impact Assessment:**
- Confidentiality: HIGH
- Integrity: MEDIUM
- Availability: LOW

**MITRE ATT&CK:** T1110.004 (Credential Stuffing)
**CWE:** CWE-307, CWE-521

**Countermeasures:**
- Implement MFA
- Enhanced rate limiting
- Account lockout
- Credential breach monitoring

---

#### THREAT-003: Broken Object-Level Authorization (BOLA) - Task Update
| Attribute | Value |
|-----------|-------|
| **Category** | Elevation of Privilege |
| **Target** | PUT /api/tasks/:id |
| **Threat Actor** | Authenticated User |
| **Risk Score** | 16 (Critical) |
| **Likelihood** | 4 - Likely |
| **Impact** | 4 - Major |

**Description:** Authenticated user can update any task by ID, regardless of ownership. The endpoint only checks authentication but not authorization.

**Prerequisites:**
- Valid JWT token
- Knowledge of other users' task IDs

**Impact Assessment:**
- Confidentiality: MEDIUM
- Integrity: HIGH
- Availability: LOW

**MITRE ATT&CK:** T1548 (Abuse Elevation Control)
**CWE:** CWE-639, CWE-284

**Code Reference:** `src/routes/tasks.js:44`
```javascript
// BUG: Should check if user owns this task!
const result = await db.query(
  'UPDATE tasks SET ... WHERE id = $5',  // Missing user_id check
  ...
);
```

---

#### THREAT-004: Broken Object-Level Authorization (BOLA) - Task Delete
| Attribute | Value |
|-----------|-------|
| **Category** | Elevation of Privilege |
| **Target** | DELETE /api/tasks/:id |
| **Threat Actor** | Authenticated User |
| **Risk Score** | 16 (Critical) |
| **Likelihood** | 4 - Likely |
| **Impact** | 4 - Major |

**Description:** Authenticated user can delete any task by ID, regardless of ownership.

**Code Reference:** `src/routes/tasks.js:67`

---

#### THREAT-013: Missing MFA Allows Single-Factor Compromise
| Attribute | Value |
|-----------|-------|
| **Category** | Spoofing |
| **Target** | Authentication System |
| **Threat Actor** | External Attacker |
| **Risk Score** | 16 (Critical) |
| **Likelihood** | 4 - Likely |
| **Impact** | 4 - Major |

**Description:** Authentication relies solely on password. If password is compromised, no secondary factor prevents account takeover.

**MITRE ATT&CK:** T1078 (Valid Accounts)
**CWE:** CWE-308

---

### High Threats (Risk Score 10-15)

| ID | Title | Category | Risk | Likelihood | Impact |
|----|-------|----------|------|------------|--------|
| THREAT-002 | Password Reset Flood Attack | DoS | 15 | 5 | 3 |
| THREAT-006 | JWT Token Theft via XSS | Spoofing | 12 | 3 | 4 |
| THREAT-007 | Brute Force Login Attack | Spoofing | 12 | 3 | 4 |
| THREAT-008 | JWT Secret Key Exposure | Info Disclosure | 10 | 2 | 5 |
| THREAT-009 | SQL Injection | Tampering | 10 | 2 | 5 |
| THREAT-010 | Insufficient Logging | Repudiation | 12 | 4 | 3 |
| THREAT-011 | Weak Password Policy | Spoofing | 12 | 4 | 3 |

---

### Medium Threats (Risk Score 5-9)

| ID | Title | Category | Risk | Likelihood | Impact |
|----|-------|----------|------|------------|--------|
| THREAT-005 | Cross-Site Request Forgery | Tampering | 9 | 3 | 3 |
| THREAT-012 | Account Enumeration | Info Disclosure | 8 | 4 | 2 |
| THREAT-014 | Insecure Password Reset Token | Spoofing | 8 | 2 | 4 |
| THREAT-015 | SendGrid API Key Exposure | Info Disclosure | 6 | 2 | 3 |

---

## STRIDE Distribution

```
STRIDE Category Analysis
========================

Spoofing               ████████████████████████████  5 threats
  └─ Credential stuffing, brute force, token theft, MFA bypass, password policy

Tampering              ████████████░░░░░░░░░░░░░░░░  2 threats
  └─ CSRF, SQL injection

Repudiation            █████░░░░░░░░░░░░░░░░░░░░░░░  1 threat
  └─ Insufficient logging

Information Disclosure ██████████████░░░░░░░░░░░░░░  3 threats
  └─ JWT exposure, enumeration, API key exposure

Denial of Service      █████░░░░░░░░░░░░░░░░░░░░░░░  1 threat
  └─ Password reset flood

Elevation of Privilege ██████████████░░░░░░░░░░░░░░  3 threats
  └─ BOLA on update, BOLA on delete, privilege escalation
```

---

## Attack Trees

### AT-001: Credential Stuffing Attack

```
                    ┌─────────────────────────────────┐
                    │   Account Takeover via         │
                    │   Credential Stuffing [AND]    │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Obtain Leaked     │   │ Bypass Rate       │   │ Successfully      │
│ Credentials [OR]  │   │ Limiting [OR]     │   │ Authenticate      │
└────────┬──────────┘   └────────┬──────────┘   │ [LEAF]            │
         │                       │              │ Difficulty: LOW   │
    ┌────┴────┐             ┌────┴────┐        └───────────────────┘
    ▼         ▼             ▼         ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│Dark   │ │Public │   │Distrib│ │Slow & │
│Web    │ │Breach │   │Attack │ │Low    │
│LOW    │ │FREE   │   │LOW    │ │FREE   │
└───────┘ └───────┘   └───────┘ └───────┘
```

### AT-002: BOLA Attack

```
                    ┌─────────────────────────────────┐
                    │   Unauthorized Task             │
                    │   Modification [AND]            │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ Obtain Valid      │   │ Discover Target   │   │ Modify/Delete     │
│ JWT Token [OR]    │   │ Task IDs [OR]     │   │ Target Task       │
└────────┬──────────┘   └────────┬──────────┘   │ [LEAF]            │
         │                       │              │ Difficulty: TRIVIAL│
    ┌────┴────┐             ┌────┴────┐        └───────────────────┘
    ▼         ▼             ▼         ▼
┌───────┐ ┌───────┐   ┌───────┐ ┌───────┐
│Register│ │Steal  │   │Enum   │ │Brute  │
│Account│ │Token  │   │Seq IDs│ │Force  │
│TRIVIAL│ │MEDIUM │   │LOW    │ │MEDIUM │
└───────┘ └───────┘   └───────┘ └───────┘
```

### AT-003: Single-Factor Compromise

```
                    ┌─────────────────────────────────┐
                    │   Single-Factor Account         │
                    │   Compromise [AND]              │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │ Obtain User       │           │ Login with Stolen │
        │ Password [OR]     │           │ Password [LEAF]   │
        └────────┬──────────┘           │ Difficulty: TRIVIAL│
                 │                      │ NOTE: No MFA blocks│
    ┌────┬───────┼───────┬────┐        └───────────────────┘
    ▼    ▼       ▼       ▼    ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
│Phish││Breach││Social││Brute││Shoulder│
│MED  ││LOW   ││MED   ││MED  ││MED    │
└─────┘└─────┘└─────┘└─────┘└─────┘
```

---

## Risk Register Summary

### By Risk Level

| Level | Count | Percentage |
|-------|-------|------------|
| Critical | 4 | 27% |
| High | 7 | 47% |
| Medium | 4 | 27% |
| Low | 0 | 0% |

### By Treatment Status

| Status | Count | Description |
|--------|-------|-------------|
| Open | 12 | Requires mitigation |
| Monitored | 3 | Accepted with monitoring |
| Closed | 0 | Resolved |

### Prioritized Risk Register

| Priority | Risk ID | Threat | Risk Score | Treatment | Owner | Due Date |
|----------|---------|--------|------------|-----------|-------|----------|
| 1 | RISK-002 | BOLA - Task Update | 16 | Mitigate | backend-team | 2026-02-01 |
| 2 | RISK-003 | BOLA - Task Delete | 16 | Mitigate | backend-team | 2026-02-01 |
| 3 | RISK-005 | Password Reset Flood | 15 | Mitigate | backend-team | 2026-02-01 |
| 4 | RISK-009 | Weak Password Policy | 12 | Mitigate | backend-team | 2026-02-01 |
| 5 | RISK-001 | Credential Stuffing | 16 | Mitigate | security-team | 2026-02-15 |
| 6 | RISK-006 | JWT Token Theft | 12 | Mitigate | frontend-team | 2026-02-15 |
| 7 | RISK-007 | Brute Force Login | 12 | Mitigate | backend-team | 2026-02-15 |
| 8 | RISK-008 | Insufficient Logging | 12 | Mitigate | platform-team | 2026-02-15 |
| 9 | RISK-012 | CSRF Attack | 9 | Mitigate | frontend-team | 2026-02-15 |
| 10 | RISK-013 | Account Enumeration | 8 | Mitigate | backend-team | 2026-02-15 |
| 11 | RISK-004 | Missing MFA | 16 | Mitigate | backend-team | 2026-03-01 |
| 12 | RISK-010 | JWT Secret Exposure | 10 | Mitigate | platform-team | 2026-03-01 |
| 13 | RISK-011 | SQL Injection | 10 | Accept | backend-team | - |
| 14 | RISK-014 | Insecure Reset Token | 8 | Accept | backend-team | - |
| 15 | RISK-015 | SendGrid Key Exposure | 6 | Accept | platform-team | - |

---

## Threat-to-Control Mapping

| Threat | Required Controls | Status |
|--------|-------------------|--------|
| THREAT-001 | MFA, Rate Limiting, Account Lockout | Partial |
| THREAT-002 | Rate Limiting on Forgot Password | Missing |
| THREAT-003 | Object-Level Authorization | Missing |
| THREAT-004 | Object-Level Authorization | Missing |
| THREAT-005 | CSRF Protection | Missing |
| THREAT-006 | HttpOnly Cookies, CSP | Missing |
| THREAT-007 | Account Lockout, Enhanced Rate Limiting | Partial |
| THREAT-008 | Secret Management, Key Rotation | Partial |
| THREAT-009 | Parameterized Queries | Implemented |
| THREAT-010 | Security Event Logging | Missing |
| THREAT-011 | Password Policy Enforcement | Missing |
| THREAT-012 | Generic Error Messages | Partial |
| THREAT-013 | Multi-Factor Authentication | Missing |
| THREAT-014 | Secure Token Generation | Implemented |
| THREAT-015 | Secret Management | Partial |

---

## Recommendations

### Immediate (This Sprint)
1. **Fix BOLA vulnerabilities** - Add `AND user_id = $N` to UPDATE/DELETE queries
2. **Add rate limiting to /forgot-password** - Apply existing `loginLimiter` middleware
3. **Implement password policy** - Minimum 12 chars, use zxcvbn for strength

### Short-term (Next 2 Sprints)
4. **Implement security logging** - Use winston/pino for auth events
5. **Add account lockout** - Lock after 10 failed attempts
6. **Implement CSRF protection** - Use csurf or SameSite cookies
7. **Fix account enumeration** - Generic registration errors

### Medium-term (Next Quarter)
8. **Implement MFA** - TOTP-based with authenticator apps
9. **Move to HttpOnly cookies** - Prevent XSS token theft
10. **Consider RS256 for JWT** - Enable key rotation
