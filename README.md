<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/claude--code-plugin-orange.svg" alt="Claude Code Plugin">
</p>

<h1 align="center">Threat Modeling Toolkit</h1>

<p align="center">
  <strong>Threat modeling inside your developer tools. No new UI. No external platform.</strong>
</p>

<p align="center">
  From quick security checks to comprehensive threat analysis—powered by Claude Code.
</p>

---

## Why This Exists

**The problem:** Threat modeling has always lived outside the developer's world. Specialized tools, separate workflows, complex frameworks that don't speak developer. Most devs skip it entirely—not because they don't care about security, but because the tooling doesn't meet them where they work.

**The solution:** Slash commands in Claude Code—the same place you already write and review code.

**For developers:** `/tm-full --docs ./docs` and you're done. Claude reads your design, identifies threats, checks if your code has the right controls. No security background needed.

**For security professionals:** Go as deep as you need. Complex trust boundaries, attack trees, STRIDE analysis, multiple compliance frameworks, control verification with file:line evidence.

---

## Real Example: TaskFlow App

Here's actual output from running the toolkit against a task management app (React + Express + PostgreSQL):

### `/tm-init` — Discover Architecture

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

Next Steps:
  Run /tm-threats to analyze threats
```

**Assets discovered:**

| ID | Name | Type | Classification |
|----|------|------|----------------|
| asset-001 | React Frontend | client | public |
| asset-002 | Express API | service | internal |
| asset-003 | PostgreSQL Database | data-store | restricted |
| asset-004 | JWT Authentication | identity | confidential |
| asset-005 | SendGrid Integration | integration | internal |

**Attack surface with gaps already flagged:**

| Endpoint | Auth | Gaps Found |
|----------|------|------------|
| POST /api/auth/login | none | - |
| POST /api/auth/forgot-password | none | **No rate limiting** |
| PUT /api/tasks/:id | jwt | **Missing BOLA check** |
| DELETE /api/tasks/:id | jwt | **Missing BOLA check** |

---

### `/tm-threats` — Analyze Threats

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

Attack Trees Generated: 5
Risk Register Entries: 15

Files Updated:
  .threatmodel/state/threats.json
  .threatmodel/state/attack-trees.json
  .threatmodel/state/risk-register.json

Next Steps:
  Run /tm-verify to check control implementations
```

**Critical threat with code reference:**

```
THREAT-003: Broken Object-Level Authorization (BOLA) - Task Update
──────────────────────────────────────────────────────────────────
Category:     Elevation of Privilege
Target:       PUT /api/tasks/:id
Risk Score:   16 (Critical)
MITRE ATT&CK: T1548
CWE:          CWE-639, CWE-284

Code Reference: src/routes/tasks.js:44
┌─────────────────────────────────────────────────────────────────┐
│ // BUG: Should check if user owns this task!                    │
│ const result = await db.query(                                  │
│   'UPDATE tasks SET ... WHERE id = $5',  // Missing user_id     │
│   ...                                                           │
│ );                                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Attack tree generated:**

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

---

### `/tm-verify` — Check Code for Controls

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
  ──────────
  Total:   10

Files Updated:
  .threatmodel/state/controls.json
  .threatmodel/state/gaps.json

Next Steps:
  Run /tm-compliance to map to frameworks
  Run /tm-report to generate risk report
```

**Implemented controls found with evidence:**

| Control | Status | Evidence |
|---------|--------|----------|
| Password Hashing | ✓ | `src/routes/auth.js:20` - bcrypt cost 10 |
| JWT Authentication | ✓ | `src/middleware/auth.js:16` |
| Rate Limiting (login) | ✓ | `src/middleware/rateLimiter.js:4-10` |
| Parameterized SQL | ✓ | All queries use $1, $2 placeholders |
| Secure Reset Token | ✓ | `src/routes/auth.js:76` - crypto.randomBytes(32) |

**Missing controls with specific gaps:**

| Gap | Severity | Issue | Fix |
|-----|----------|-------|-----|
| GAP-001 | Critical | PUT /tasks/:id lacks ownership check | Add `AND user_id = $N` |
| GAP-002 | Critical | DELETE /tasks/:id lacks ownership check | Add `AND user_id = $N` |
| GAP-003 | High | /forgot-password has no rate limiting | Add loginLimiter middleware |
| GAP-004 | Critical | No MFA implementation | Implement TOTP |
| GAP-006 | High | No security event logging | Add winston/pino |

---

### `/tm-compliance` — Map to Frameworks

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
  A07 Authentication Failures:   █████░░░░░ 45%  (3 gaps) PARTIAL
  A08 Integrity Failures:        ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  A09 Logging Failures:          ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 52%

SOC2 Trust Services:
  CC6.1 Logical Access:          ████░░░░░░ 40%  (2 gaps) PARTIAL
  CC6.2 Authentication:          ████░░░░░░ 35%  (3 gaps) PARTIAL
  CC6.3 Access Restrictions:     ██░░░░░░░░ 20%  (2 gaps) NON-COMPLIANT
  CC6.7 Transmission Integrity:  ██████████ 100%         COMPLIANT
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

### `/tm-tests` — Generate Security Tests

```
Test Generation Complete
========================

Format: jest

Tests Generated:
  Authentication: 10 tests
  Authorization: 8 tests
  Input Validation: 11 tests
  ─────────────────────────
  Total: 29 tests

Expected Failures: 6 tests
  (Document known gaps - will pass after remediation)

Files Created:
  .threatmodel/tests/auth-security.test.js
  .threatmodel/tests/authz-security.test.js
  .threatmodel/tests/input-validation.test.js
```

**Sample generated test documenting a gap:**

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

### `/tm-status` — Quick Overview

```
═══════════════════════════════════════════════════════════════
                    THREAT MODEL STATUS
═══════════════════════════════════════════════════════════════

Project: TaskFlow v1.0.0
Framework: STRIDE
Last Updated: 2026-01-20

───────────────────────────────────────────────────────────────
                        THREATS
───────────────────────────────────────────────────────────────

Total: 15 threats

By Severity:
  ├── Critical:  4  ██████████░░░░░░░░░░  27%
  ├── High:      7  ██████████████████░░  47%
  ├── Medium:    4  ██████████░░░░░░░░░░  27%
  └── Low:       0  ░░░░░░░░░░░░░░░░░░░░   0%

───────────────────────────────────────────────────────────────
                       CONTROLS
───────────────────────────────────────────────────────────────

Implementation Status:
  ├── Implemented: 5  █████████████░░░░░░░  33%
  ├── Partial:     3  ████████░░░░░░░░░░░░  20%
  └── Missing:     7  ██████████████████░░  47%

───────────────────────────────────────────────────────────────
                      COMPLIANCE
───────────────────────────────────────────────────────────────

OWASP Top 10 2021:  52%  ██████░░░░
SOC2 Trust Services: 48%  █████░░░░░

═══════════════════════════════════════════════════════════════
```

---

## What You Get

### Directory Structure

```
.threatmodel/
├── config.yaml                  # Configuration
├── state/
│   ├── assets.json              # Asset inventory
│   ├── dataflows.json           # Data flow definitions
│   ├── trust-boundaries.json    # Trust boundaries
│   ├── attack-surface.json      # Entry points
│   ├── threats.json             # Threat catalog
│   ├── attack-trees.json        # Attack decomposition
│   ├── controls.json            # Control inventory
│   ├── gaps.json                # Security gaps
│   ├── risk-register.json       # Risk prioritization
│   └── compliance.json          # Framework mapping
├── diagrams/
│   ├── architecture.mmd         # Mermaid: system view
│   ├── dataflow.mmd             # Mermaid: data flows
│   └── trust-boundaries.mmd     # Mermaid: boundaries
├── reports/
│   ├── risk-report.md           # Detailed findings
│   ├── executive-summary.md     # High-level summary
│   └── compliance-report.md     # Framework coverage
├── tests/
│   └── *.test.js                # Generated test cases
└── baseline/
    └── snapshot-YYYYMMDD.json   # Historical snapshots
```

---

## The 9 Skills

| Skill | Purpose | Output |
|-------|---------|--------|
| `/tm-init` | Discover architecture | `assets.json`, `dataflows.json`, Mermaid diagrams |
| `/tm-threats` | Analyze threats | `threats.json`, `attack-trees.json`, risk scores |
| `/tm-verify` | Check code for controls | `controls.json`, `gaps.json` with file:line evidence |
| `/tm-compliance` | Map to frameworks | `compliance.json`, coverage percentages |
| `/tm-report` | Generate documentation | `risk-report.md`, `executive-summary.md` |
| `/tm-drift` | Track changes | Diff against baseline, new threat detection |
| `/tm-tests` | Create security tests | Test files for Jest/Pytest |
| `/tm-status` | Quick overview | Current posture summary |
| `/tm-full` | Complete workflow | Everything above, one command |

---

## Quick Start

```bash
# Install
/install github:josemlopez/threat-modeling-toolkit

# Run full analysis
/tm-full --docs ./docs --compliance owasp,soc2
```

Or run individual phases:

```bash
/tm-init --docs ./docs              # Discover architecture
/tm-threats --framework stride      # Analyze threats
/tm-verify --thorough               # Check controls in code
/tm-compliance --framework owasp    # Map to frameworks
/tm-report --level detailed         # Generate reports
/tm-status                          # Quick overview
/tm-drift --create-baseline         # Track changes
/tm-tests --format jest             # Generate tests
```

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

---

## Try the Test Cases

The `TEST/` directory contains two example projects:

- **`TEST/simple-app/`** — Developer experience (React + Express task app)
- **`TEST/complex-system/`** — Security expert experience (enterprise financial platform)

Results from running all skills are in `TEST/results/`.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with Claude Code</strong><br>
  <em>Threat modeling shouldn't require leaving your dev environment.</em>
</p>

<p align="center">
  <a href="https://github.com/josemlopez/threat-modeling-toolkit">Star on GitHub</a> |
  <a href="https://github.com/josemlopez/threat-modeling-toolkit/issues">Report Bug</a> |
  <a href="https://github.com/josemlopez/threat-modeling-toolkit/issues">Request Feature</a>
</p>
