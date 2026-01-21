**I open-sourced a threat modeling toolkit for Claude Code.**

𝗧𝗵𝗲 𝗽𝗿𝗼𝗯𝗹𝗲𝗺: Threat modeling has always been "that thing security teams do." Specialized tools, separate workflows, complex frameworks that don't speak developer.

𝗧𝗵𝗲 𝘀𝗼𝗹𝘂𝘁𝗶𝗼𝗻: Threat modeling inside your developer tools. No new UI. No external platform. Just slash commands in Claude Code—the same place you already write and review code.

**For developers**: `/tm-full --docs ./docs` and you're done. Claude reads your architecture, identifies threats, checks if your code has the right controls. No security background needed.

**For security pros**: Go deep. Complex trust boundaries, attack trees, STRIDE analysis, multiple compliance frameworks, control verification with file:line evidence. As detailed as you need it.

---

**𝟵 𝘀𝗸𝗶𝗹𝗹𝘀. 𝗙𝘂𝗹𝗹 𝗹𝗶𝗳𝗲𝗰𝘆𝗰𝗹𝗲.**

`/tm-init` → Extracts assets, data flows, trust boundaries from your docs

`/tm-threats` → Applies STRIDE. Builds attack trees. Scores risks.

`/tm-verify` → Searches your CODE to verify controls exist

`/tm-compliance` → Maps to OWASP, SOC2, PCI-DSS

`/tm-report` → Prioritized findings + countermeasures

`/tm-drift` → Detects what changed since last baseline

`/tm-tests` → Generates security test cases

`/tm-full` → Runs everything end-to-end

---

**𝗥𝗲𝗮𝗹 𝗼𝘂𝘁𝗽𝘂𝘁 𝗳𝗿𝗼𝗺 𝗮 𝘁𝗲𝘀𝘁 𝗿𝘂𝗻:**

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
```

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

```
Compliance Mapping Complete
===========================

OWASP Top 10 2021:
  A01 Broken Access Control:     ██░░░░░░░░ 15%  (2 gaps) NON-COMPLIANT
  A02 Cryptographic Failures:    █████████░ 90%          COMPLIANT
  A03 Injection:                 ███████░░░ 70%  (1 gap) PARTIAL
  A07 Authentication Failures:   █████░░░░░ 45%  (3 gaps) PARTIAL
  ─────────────────────────────────────────────────────
  Overall: 52%
```

---

**𝗪𝗵𝗮𝘁 𝘆𝗼𝘂 𝗴𝗲𝘁:**

→ JSON state files (assets, threats, controls, gaps)
→ Mermaid diagrams that render on GitHub
→ Markdown reports with visual progress bars
→ Control verification with file:line evidence
→ Security test cases ready for CI/CD
→ Drift detection to track changes over time

---

**𝗜𝗻𝘀𝘁𝗮𝗹𝗹:**

```
/install github:josemlopez/threat-modeling-toolkit
```

**𝗨𝘀𝗲:**

```
/tm-full --docs ./docs --compliance owasp,soc2
```

---

𝗟𝗶𝗻𝗸: https://github.com/josemlopez/threat-modeling-toolkit

Whether you're a developer who's never done threat modeling, or a security pro who needs depth—this meets you where you are.

Try it. Tell me what's missing.

#security #threatmodeling #claudecode #appsec #devsecops #opensource
