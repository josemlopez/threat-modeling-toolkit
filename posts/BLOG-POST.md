# Threat Modeling for Everyone: A Claude Code Toolkit

## From Quick Security Checks to Comprehensive Analysis—One Command

I built a threat modeling toolkit for Claude Code. It's open source and works for everyone—from developers who've never done threat modeling to security professionals who need depth.

**Repository:** https://github.com/josemlopez/threat-modeling-toolkit

Let me explain why I built it and what it does.

---

## The Real Problem With Threat Modeling

Threat modeling has always lived outside the developer's world.

Specialized tools. Separate workflows. Frameworks that don't speak developer. You need to leave your IDE, learn a new platform, translate between security-speak and code.

Most developers skip it entirely. Not because they don't care about security—but because the tooling doesn't meet them where they work.

---

## The Solution: Threat Modeling Inside Your Dev Tools

No new UI. No external platform. Just slash commands in Claude Code—the same place you already write and review code.

**For developers:**

```
/tm-full --docs ./docs
```

That's it. Claude reads your design documents, identifies what you're building, applies threat analysis, and checks if your code matches what you documented. No security background needed.

**For security professionals:**

Go as deep as you need. Complex trust boundaries, attack trees, STRIDE analysis, multiple compliance frameworks, control verification with file:line evidence.

The toolkit scales with your expertise—add as much detail as you want, and Claude handles the analysis.

---

## What It Does

- **Automatic discovery** - Reads your docs and extracts assets, data flows, trust boundaries
- **STRIDE analysis** - Systematic threat identification for every component
- **Code verification** - Searches your codebase to confirm controls actually exist
- **Compliance mapping** - Automatically maps to OWASP, SOC2, PCI-DSS
- **Gap detection** - Shows exactly what's missing, with file:line evidence
- **Test generation** - Creates security tests from identified threats

---

## Real Output From a Test Run

I ran the toolkit against a simple task management app (React + Express + PostgreSQL). Here's what it found:

### Phase 1: Discovery (`/tm-init`)

```
Threat Model Initialized
========================

Project: TaskFlow
Framework: STRIDE

Discovered:
  - 5 assets (1 client, 1 service, 1 data-store, 1 identity, 1 integration)
  - 8 data flows (8 cross trust boundaries)
  - 4 trust boundaries
  - 8 attack surface entries

Created:
  .threatmodel/config.yaml
  .threatmodel/state/assets.json
  .threatmodel/state/dataflows.json
  .threatmodel/state/trust-boundaries.json
  .threatmodel/state/attack-surface.json
  .threatmodel/diagrams/architecture.mmd
  .threatmodel/diagrams/dataflow.mmd
```

The toolkit identified:
- **React Frontend** (Vercel)
- **Express API** (Railway)
- **PostgreSQL Database**
- **JWT Authentication**
- **SendGrid Integration**

Plus every API endpoint, with gaps already flagged:

| Endpoint | Auth | Gaps |
|----------|------|------|
| POST /api/auth/login | none | - |
| POST /api/auth/forgot-password | none | **No rate limiting** |
| PUT /api/tasks/:id | jwt | **Missing BOLA check** |
| DELETE /api/tasks/:id | jwt | **Missing BOLA check** |

---

### Phase 2: Threat Analysis (`/tm-threats`)

```
Threat Analysis Complete
========================

Framework: STRIDE
Assets Analyzed: 5
Attack Surfaces Analyzed: 8

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
```

Each threat gets full analysis:

**THREAT-003: Broken Object-Level Authorization (BOLA) - Task Update**

| Attribute | Value |
|-----------|-------|
| Category | Elevation of Privilege |
| Target | PUT /api/tasks/:id |
| Risk Score | 16 (Critical) |
| MITRE ATT&CK | T1548 |
| CWE | CWE-639, CWE-284 |

**Code Reference:** `src/routes/tasks.js:44`
```javascript
// BUG: Should check if user owns this task!
const result = await db.query(
  'UPDATE tasks SET ... WHERE id = $5',  // Missing user_id check
  ...
);
```

The toolkit also generates attack trees for critical threats showing the steps an attacker would take.

---

### Phase 3: Control Verification (`/tm-verify`)

This is where it gets interesting. The toolkit searches your codebase to verify controls actually exist.

```
Control Verification Complete
=============================

Controls Analyzed: 15

Verification Results:
  ✓ Implemented: 5  (33%)
  ⚠ Partial:     3  (20%)
  ✗ Missing:     7  (47%)

Gaps Identified:
  Critical: 3
  High:     5
  Medium:   2
```

**Implemented controls found with evidence:**

| Control | Status | Evidence |
|---------|--------|----------|
| Password Hashing | ✓ | `src/routes/auth.js:20` - bcrypt cost 10 |
| JWT Authentication | ✓ | `src/middleware/auth.js:16` |
| Rate Limiting (login) | ✓ | `src/middleware/rateLimiter.js:4-10` |
| Parameterized SQL | ✓ | All queries use $1, $2 placeholders |

**Missing controls with specific gaps:**

| Gap | Issue | Fix |
|-----|-------|-----|
| GAP-001 | PUT /tasks/:id lacks ownership check | Add `AND user_id = $N` |
| GAP-002 | DELETE /tasks/:id lacks ownership check | Add `AND user_id = $N` |
| GAP-003 | /forgot-password has no rate limiting | Add loginLimiter middleware |
| GAP-004 | No MFA implementation | Implement TOTP |

---

### Phase 4: Compliance Mapping (`/tm-compliance`)

```
Compliance Mapping Complete
===========================

OWASP Top 10 2021:
  A01 Broken Access Control:     ██░░░░░░░░ 15%  (2 gaps) NON-COMPLIANT
  A02 Cryptographic Failures:    █████████░ 90%          COMPLIANT
  A03 Injection:                 ███████░░░ 70%  (1 gap) PARTIAL
  A04 Insecure Design:           ░░░░░░░░░░  0%  (2 gaps) NON-COMPLIANT
  A05 Security Misconfiguration: █████░░░░░ 50%  (1 gap) PARTIAL
  A07 Authentication Failures:   █████░░░░░ 45%  (3 gaps) PARTIAL
  A08 Integrity Failures:        ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  A09 Logging Failures:          ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 52%

SOC2 Trust Services:
  CC6.1 Logical Access:          ████░░░░░░ 40%  (2 gaps) PARTIAL
  CC6.2 Authentication:          ████░░░░░░ 35%  (3 gaps) PARTIAL
  CC6.7 Transmission Integrity:  ██████████ 100%         COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 48%
```

Everything is traceable: Requirement → Threat → Control → Code Location.

---

### Phase 5: Test Generation (`/tm-tests`)

```
Test Generation Complete
========================

Tests Generated:
  Authentication: 10 tests
  Authorization: 8 tests
  Input Validation: 11 tests
  ─────────────────────────
  Total: 29 tests

Expected Failures: 6 tests
  (Document known gaps - will pass after remediation)
```

Sample generated test:

```javascript
it('TEST-012: [EXPECTED FAIL] Should block user from updating others task', async () => {
  // NOTE: This test documents GAP-001
  // Currently NO ownership check - test should fail until fixed

  const response = await request(app)
    .put(`/api/tasks/${userATaskId}`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({ title: 'Hacked by User B' });

  // Should return 403 Forbidden (FAILS until GAP-001 fixed)
  expect(response.status).toBe(403);
});
```

When the test starts passing, you know the gap is fixed.

---

### Phase 6: Drift Detection (`/tm-drift`)

Create a baseline after analysis, then detect changes:

```
Drift Detection Complete
========================

Compared against: baseline/snapshot-20260120.json

Changes Detected:
  Assets:           0 added, 0 removed, 0 modified
  Controls:         0 status changes
  Gaps:             0 new, 0 closed

Status: STABLE
```

When code changes, drift detection shows what's new or missing.

---

## What Makes This Different

### 1. Code-Connected

Traditional threat models describe what *should* exist. This one verifies what *does* exist. Every control has evidence. Every gap has a file path.

### 2. Living Document

Drift detection means your threat model stays current. New component added? It gets flagged. Control removed? You'll know.

### 3. Compliance-Ready

Auditors want traceability. This provides it: Requirement → Threat → Control → Code Location → Test.

### 4. Actionable Output

Not just a list of threats—prioritized risks with specific countermeasures, effort estimates, and test cases.

### 5. Visual Reports

All reports include visual progress bars and status indicators that persist in the markdown files:

```
CONTROL STATUS
─────────────────────────────────────────────────────────
✓ Implemented │████████████████████████████████████░░░░│ 18 (62%)
⚠ Partial     │██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░│  7 (24%)
✗ Missing     │████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  4 (14%)
```

---

## Installation

```bash
/install github:josemlopez/threat-modeling-toolkit
```

That's it. All 9 skills are available immediately.

---

## Try It

**Repository:** https://github.com/josemlopez/threat-modeling-toolkit

Whether you're a developer who's never done threat modeling, or a security professional who needs comprehensive analysis—this toolkit meets you where you are.

Install it. Point it at your docs. See what it finds.

Then tell me what's missing. Open an issue. Submit a PR.

---

*Built with Claude Code. Because threat modeling shouldn't require a security degree—it should be accessible to everyone who builds software.*
