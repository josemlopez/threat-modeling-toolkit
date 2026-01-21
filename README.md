<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/claude--code-plugin-orange.svg" alt="Claude Code Plugin">
</p>

<h1 align="center">Threat Modeling Toolkit</h1>

<p align="center">
  <strong>Threat modeling inside your developer tools. No new UI. No external platform.</strong>
</p>

---

## Installation

```bash
/install github:josemlopez/threat-modeling-toolkit
```

That's it. All 9 skills are now available in Claude Code.

---

## Quick Start: Try It in 2 Minutes

The toolkit includes a test project you can analyze immediately.

### Step 1: Clone and navigate to the test app

```bash
git clone https://github.com/josemlopez/threat-modeling-toolkit.git
cd threat-modeling-toolkit/TEST/simple-app
```

### Step 2: Run the full analysis

```bash
/tm-full --docs ./docs --compliance owasp,soc2
```

### Step 3: See the results

```
.threatmodel/
├── state/
│   ├── assets.json          # 5 assets discovered
│   ├── threats.json         # 15 threats identified
│   ├── controls.json        # 5 implemented, 7 missing
│   └── gaps.json            # 10 security gaps
├── diagrams/
│   └── architecture.mmd     # Mermaid diagram
└── reports/
    ├── risk-report.md       # Full findings
    └── compliance-report.md # OWASP 52%, SOC2 48%
```

---

## Step-by-Step Tutorial

Let's walk through each skill using the `TEST/simple-app` project (a React + Express + PostgreSQL task manager with intentional security gaps).

### Step 1: Initialize the Threat Model

```bash
/tm-init --docs ./docs
```

**What it does:** Reads your architecture documentation and extracts assets, data flows, trust boundaries, and attack surface.

**Output:**

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
  .threatmodel/diagrams/architecture.mmd

Next Steps:
  Run /tm-threats to analyze threats
```

**Files created:**
- `assets.json` — React Frontend, Express API, PostgreSQL, JWT Auth, SendGrid
- `attack-surface.json` — All API endpoints with auth requirements
- `architecture.mmd` — Mermaid diagram ready to render

---

### Step 2: Analyze Threats

```bash
/tm-threats
```

**What it does:** Applies STRIDE analysis to every asset and data flow. Generates attack trees for critical threats.

**Output:**

```
Threat Analysis Complete
========================

Framework: STRIDE
Assets Analyzed: 5

Threats Identified:
  Critical: 4
  High:     7
  Medium:   4
  Total:   15

Top Critical Threats:
  1. [THREAT-001] Credential Stuffing Attack (Risk: 16)
  2. [THREAT-003] BOLA - Task Update (Risk: 16)
  3. [THREAT-004] BOLA - Task Delete (Risk: 16)
  4. [THREAT-013] Missing MFA (Risk: 16)

Files Updated:
  .threatmodel/state/threats.json
  .threatmodel/state/attack-trees.json
  .threatmodel/state/risk-register.json

Next Steps:
  Run /tm-verify to check control implementations
```

**What you'll find in threats.json:**

Each threat includes category, target, risk score, MITRE ATT&CK mapping, CWE references, and recommended countermeasures.

---

### Step 3: Verify Controls in Code

```bash
/tm-verify
```

**What it does:** Searches your codebase to verify security controls actually exist. Provides file:line evidence.

**Output:**

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

Files Updated:
  .threatmodel/state/controls.json
  .threatmodel/state/gaps.json

Next Steps:
  Run /tm-compliance to map to frameworks
```

**Evidence found:**

| Control | Status | Evidence |
|---------|--------|----------|
| Password Hashing | ✓ | `src/routes/auth.js:20` - bcrypt cost 10 |
| JWT Authentication | ✓ | `src/middleware/auth.js:16` |
| Rate Limiting (login) | ✓ | `src/middleware/rateLimiter.js:4-10` |
| BOLA Protection | ✗ | Missing in `src/routes/tasks.js:44` |
| MFA | ✗ | Not found |

---

### Step 4: Map to Compliance Frameworks

```bash
/tm-compliance --framework owasp,soc2
```

**What it does:** Maps your threats and controls to OWASP Top 10, SOC2, PCI-DSS.

**Output:**

```
Compliance Mapping Complete
===========================

OWASP Top 10 2021:
  A01 Broken Access Control:     ██░░░░░░░░ 15%  (2 gaps) NON-COMPLIANT
  A02 Cryptographic Failures:    █████████░ 90%          COMPLIANT
  A03 Injection:                 ███████░░░ 70%  (1 gap) PARTIAL
  A07 Authentication Failures:   █████░░░░░ 45%  (3 gaps) PARTIAL
  A09 Logging Failures:          ░░░░░░░░░░  0%  (1 gap) NON-COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 52%

SOC2 Trust Services:
  CC6.1 Logical Access:          ████░░░░░░ 40%  PARTIAL
  CC6.2 Authentication:          ████░░░░░░ 35%  PARTIAL
  CC6.7 Transmission Integrity:  ██████████ 100% COMPLIANT
  ─────────────────────────────────────────────────────
  Overall: 48%

Files Created:
  .threatmodel/state/compliance.json
  .threatmodel/reports/compliance-report.md
```

---

### Step 5: Generate Reports

```bash
/tm-report
```

**What it does:** Creates markdown reports for stakeholders.

**Files created:**
- `risk-report.md` — Detailed findings with attack scenarios
- `executive-summary.md` — 1-page overview for leadership

---

### Step 6: Generate Security Tests

```bash
/tm-tests --format jest
```

**What it does:** Creates test cases from identified threats.

**Output:**

```
Test Generation Complete
========================

Tests Generated: 29
  Authentication: 10 tests
  Authorization: 8 tests
  Input Validation: 11 tests

Expected Failures: 6 tests
  (Document known gaps - will pass after remediation)

Files Created:
  .threatmodel/tests/auth-security.test.js
  .threatmodel/tests/authz-security.test.js
```

**Sample generated test:**

```javascript
it('TEST-012: [EXPECTED FAIL] Should block user from updating others task', async () => {
  // Documents GAP-001 - will pass after fix
  const response = await request(app)
    .put(`/api/tasks/${userATaskId}`)
    .set('Authorization', `Bearer ${userBToken}`)
    .send({ title: 'Hacked by User B' });

  expect(response.status).toBe(403);
});
```

---

### Step 7: Track Changes Over Time

```bash
/tm-drift --create-baseline
```

After code changes:

```bash
/tm-drift
```

**What it does:** Compares current state to baseline. Detects new components, removed controls, changed configurations.

---

### Step 8: Quick Status Check

```bash
/tm-status
```

**Output:**

```
═══════════════════════════════════════════════════════════════
                    THREAT MODEL STATUS
═══════════════════════════════════════════════════════════════

Project: TaskFlow v1.0.0
Framework: STRIDE

───────────────────────────────────────────────────────────────
                        THREATS
───────────────────────────────────────────────────────────────
Total: 15 threats
  ├── Critical:  4  ██████████░░░░░░░░░░  27%
  ├── High:      7  ██████████████████░░  47%
  └── Medium:    4  ██████████░░░░░░░░░░  27%

───────────────────────────────────────────────────────────────
                       CONTROLS
───────────────────────────────────────────────────────────────
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

## Or Just Run Everything at Once

```bash
/tm-full --docs ./docs --compliance owasp,soc2
```

This runs all phases automatically: init → threats → verify → compliance → report.

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

## Test Projects Included

The `TEST/` directory contains two example projects:

| Project | Description | Use Case |
|---------|-------------|----------|
| `TEST/simple-app/` | React + Express task manager | Developer experience |
| `TEST/complex-system/` | Enterprise financial platform | Security expert experience |

Pre-generated results are in `TEST/results/` so you can see expected output.

---

## Why This Exists

**The problem:** Threat modeling has always lived outside the developer's world. Specialized tools, separate workflows, complex frameworks that don't speak developer.

**The solution:** Slash commands in Claude Code—the same place you already write and review code.

**For developers:** `/tm-full --docs ./docs` and you're done. No security background needed.

**For security professionals:** Go as deep as you need. Complex trust boundaries, attack trees, STRIDE analysis, multiple compliance frameworks, control verification with file:line evidence.

---

## What Makes This Different

### Code-Connected
Every control has evidence. Every gap has a file path. Not assumptions—verification.

### Living Document
Drift detection keeps your threat model current as code changes.

### Compliance-Ready
Traceable evidence: Requirement → Threat → Control → Code Location → Test.

### Actionable Output
Prioritized risks with specific countermeasures, effort estimates, and test cases.

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
