# Threat Modeling Toolkit for Claude Code

AI-powered threat modeling that transforms security analysis from a one-time documentation exercise into a continuous, code-verified practice.

## Features

- **Architecture Analysis**: Automatically discover assets, data flows, and trust boundaries from your documentation
- **Threat Discovery**: Apply STRIDE/PASTA frameworks to systematically identify threats
- **Control Verification**: Check if security controls actually exist in your codebase
- **Compliance Mapping**: Map threats and controls to OWASP, SOC2, PCI-DSS, and custom frameworks
- **Risk Reporting**: Generate prioritized risk reports with actionable countermeasures
- **Drift Detection**: Track changes between threat model versions
- **Test Generation**: Create security test cases from identified threats

## Installation

### From Marketplace

```bash
# Add the marketplace
/plugin marketplace add josemlopez/threat-modeling-toolkit

# Install the plugin
/plugin install threat-modeling-toolkit@josemlopez
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/joseandu/threat-modeling-toolkit.git

# Test locally
claude --plugin-dir ./threat-modeling-toolkit
```

## Skills

| Skill | Description |
|-------|-------------|
| `/tm-init` | Initialize threat model from architecture docs |
| `/tm-threats` | Analyze threats using STRIDE/PASTA |
| `/tm-verify` | Verify controls exist in codebase |
| `/tm-compliance` | Map to OWASP, SOC2, PCI-DSS |
| `/tm-report` | Generate prioritized risk report |
| `/tm-drift` | Detect changes since baseline |
| `/tm-tests` | Generate security test cases |
| `/tm-status` | Show current threat model status |
| `/tm-full` | Run complete workflow |

## Quick Start

### 1. Initialize Your Threat Model

```bash
/tm-init --docs ./docs/architecture
```

This analyzes your architecture documentation and creates:
- Asset inventory
- Data flow diagrams
- Trust boundary map
- Attack surface catalog

### 2. Analyze Threats

```bash
/tm-threats --framework stride
```

Systematically identifies threats for each component using STRIDE methodology.

### 3. Verify Controls

```bash
/tm-verify --thorough
```

Searches your codebase to verify that documented security controls are actually implemented.

### 4. Generate Report

```bash
/tm-report --format markdown --level detailed
```

Creates a comprehensive risk report with:
- Executive summary
- Prioritized risks
- Gap analysis
- Compliance status
- Recommendations

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /tm-init  │────▶│ /tm-threats │────▶│  /tm-verify │
│  Discovery  │     │  Analysis   │     │Verification │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
       ┌───────────────────────────────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│/tm-compliance────▶│  /tm-report │────▶│  /tm-drift  │
│   Mapping   │     │  Reporting  │     │  Monitoring │
└─────────────┘     └─────────────┘     └─────────────┘
```

Or run the full workflow:

```bash
/tm-full --docs ./architecture --compliance owasp,soc2
```

## Output Structure

The toolkit creates a `.threatmodel/` directory:

```
.threatmodel/
├── config.yaml              # Configuration
├── state/
│   ├── assets.json          # Asset inventory
│   ├── dataflows.json       # Data flow definitions
│   ├── trust-boundaries.json
│   ├── attack-surface.json
│   ├── threats.json         # Threat catalog
│   ├── controls.json        # Control inventory
│   ├── gaps.json            # Gap analysis
│   └── risk-register.json
├── diagrams/
│   ├── architecture.mmd     # Mermaid diagrams
│   ├── dataflow.mmd
│   └── attack-trees/
├── reports/
│   ├── risk-report.md
│   ├── compliance-report.md
│   └── executive-summary.md
└── baseline/
    └── snapshot-{date}.json
```

## Frameworks Supported

### Threat Analysis
- **STRIDE**: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
- **PASTA**: Process for Attack Simulation and Threat Analysis (coming soon)
- **Custom**: Define your own threat taxonomy

### Compliance
- OWASP Top 10 (2021)
- SOC2 Trust Services Criteria
- PCI-DSS
- HIPAA
- GDPR
- Custom policy files

## Configuration

Create `.threatmodel/config.yaml`:

```yaml
project:
  name: "My Application"
  version: "1.0.0"

analysis:
  framework: "stride"
  depth: "standard"

documentation:
  paths:
    - "./docs/architecture"
    - "./docs/design"

verification:
  code_paths:
    - "./src"
  exclude_paths:
    - "./node_modules"
    - "./**/*.test.*"

compliance:
  frameworks:
    - owasp
    - soc2
```

## Example Output

### Risk Report Summary

```
Threat Model Risk Report
========================

Discovered: 14 assets, 22 data flows, 5 trust boundaries
Threats: 47 total (5 critical, 12 high, 18 medium, 12 low)
Controls: 29 required (18 verified, 7 partial, 4 missing)

Critical Findings:
  1. [THREAT-001] Credential Stuffing Attack (Risk: 8.5)
  2. [THREAT-002] SQL Injection in Search API (Risk: 8.2)
  3. [THREAT-003] JWT Token Theft via XSS (Risk: 8.0)

Top Recommendations:
  1. [HIGH] Implement mandatory MFA
  2. [HIGH] Fix SQL injection in legacy module
  3. [MEDIUM] Add rate limiting to password reset
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Threat Model Analysis

on:
  pull_request:
    paths:
      - 'src/**'
      - 'docs/architecture/**'

jobs:
  threat-model:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run threat model drift detection
        run: claude /tm-drift --baseline .threatmodel/baseline/latest.json
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- STRIDE framework by Microsoft
- OWASP for threat categorization guidance
- The security community for continuous improvement

---

Built with Claude Code
