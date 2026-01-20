# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-20

### Added

- Initial release of Threat Modeling Toolkit for Claude Code
- **Skills**:
  - `/tm-init`: Initialize threat model from architecture documentation
  - `/tm-threats`: Analyze threats using STRIDE framework
  - `/tm-verify`: Verify security controls in codebase
  - `/tm-compliance`: Map to OWASP, SOC2, PCI-DSS frameworks
  - `/tm-report`: Generate prioritized risk reports
  - `/tm-drift`: Detect changes since baseline
  - `/tm-tests`: Generate security test cases
  - `/tm-status`: Show current threat model status
  - `/tm-full`: Run complete threat modeling workflow
- **Frameworks**:
  - STRIDE threat analysis methodology
  - OWASP Top 10 2021 compliance mapping
  - SOC2 Trust Services Criteria mapping
- **Outputs**:
  - Asset inventory with classification
  - Data flow diagrams (Mermaid)
  - Trust boundary mapping
  - Attack surface catalog
  - Threat catalog with risk scoring
  - Control inventory with verification status
  - Gap analysis
  - Risk register
  - Compliance reports
  - Executive summaries
- **Data Model**:
  - JSON schema for all threat model entities
  - Consistent ID patterns for traceability
- **Documentation**:
  - Comprehensive README
  - STRIDE framework reference
  - Full specification document

### Security

- Skills use restricted tool permissions
- No execution of untrusted code
- Read-only analysis by default

---

## [Unreleased]

### Planned

- PASTA framework support
- Attack tree visualization
- MITRE ATT&CK mapping
- Custom threat taxonomy support
- MCP server for advanced integrations
- PR review automation
- Slack/Jira notifications
