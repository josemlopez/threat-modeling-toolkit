# Hybrid Architecture: Skills + MCP Server

## Future Enhancement Roadmap

This document outlines the planned hybrid architecture that combines Claude Code Skills (for user experience) with an MCP Server (for heavy computation and integrations).

---

## Current Architecture (v1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code CLI                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Skills Layer                        │   │
│  │                                                      │   │
│  │  /tm-init  /tm-threats  /tm-verify  /tm-report ...  │   │
│  │                                                      │   │
│  │  • Direct file operations                           │   │
│  │  • Claude performs all analysis                     │   │
│  │  • Output to .threatmodel/                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 File System                          │   │
│  │                                                      │   │
│  │  .threatmodel/                                       │   │
│  │  ├── state/*.json                                   │   │
│  │  ├── diagrams/*.mmd                                 │   │
│  │  └── reports/*.md                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Limitations**:
- All computation done by Claude (token-intensive)
- No external integrations
- No real-time vulnerability data
- No caching or persistence between sessions
- No CI/CD integration

---

## Hybrid Architecture (v2.0 - Planned)

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code CLI                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Skills Layer (UX)                       │   │
│  │                                                      │   │
│  │  /tm-init  /tm-threats  /tm-verify  /tm-report ...  │   │
│  │                                                      │   │
│  │  • User interaction                                 │   │
│  │  • Orchestration                                    │   │
│  │  • Result presentation                              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│                         │ MCP Protocol                      │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MCP Server (Computation)                   │   │
│  │                                                      │   │
│  │  Tools:                                             │   │
│  │  ├── tm_discover_assets                             │   │
│  │  ├── tm_analyze_threats                             │   │
│  │  ├── tm_verify_controls                             │   │
│  │  ├── tm_calculate_compliance                        │   │
│  │  ├── tm_generate_report                             │   │
│  │  └── tm_check_vulnerabilities                       │   │
│  │                                                      │   │
│  │  Resources:                                         │   │
│  │  ├── threat://catalog/{category}                    │   │
│  │  ├── compliance://owasp/2021                        │   │
│  │  ├── compliance://soc2                              │   │
│  │  └── cve://recent                                   │   │
│  │                                                      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │    NVD    │  │   MITRE   │  │   GitHub  │              │
│  │    CVE    │  │  ATT&CK   │  │ Advisories│              │
│  └───────────┘  └───────────┘  └───────────┘              │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │   Jira    │  │   Slack   │  │  Webhook  │              │
│  │           │  │           │  │  Delivery │              │
│  └───────────┘  └───────────┘  └───────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## MCP Server Specification

### Tools

#### tm_discover_assets
```typescript
{
  name: "tm_discover_assets",
  description: "Scan documentation and codebase to discover assets",
  inputSchema: {
    type: "object",
    properties: {
      docs_path: { type: "string", description: "Path to documentation" },
      code_path: { type: "string", description: "Path to codebase" },
      patterns: { type: "array", items: { type: "string" } }
    },
    required: ["docs_path"]
  }
}
```

#### tm_analyze_threats
```typescript
{
  name: "tm_analyze_threats",
  description: "Analyze threats using STRIDE/PASTA framework",
  inputSchema: {
    type: "object",
    properties: {
      assets: { type: "array", description: "Asset inventory" },
      framework: { type: "string", enum: ["stride", "pasta"] },
      depth: { type: "string", enum: ["quick", "standard", "deep"] }
    },
    required: ["assets"]
  }
}
```

#### tm_verify_controls
```typescript
{
  name: "tm_verify_controls",
  description: "Verify security controls in codebase",
  inputSchema: {
    type: "object",
    properties: {
      controls: { type: "array", description: "Required controls" },
      code_path: { type: "string" },
      patterns: { type: "object", description: "Search patterns per control" }
    },
    required: ["controls", "code_path"]
  }
}
```

#### tm_check_vulnerabilities
```typescript
{
  name: "tm_check_vulnerabilities",
  description: "Check for known vulnerabilities in dependencies",
  inputSchema: {
    type: "object",
    properties: {
      package_file: { type: "string", description: "Path to package.json/requirements.txt" },
      severity_threshold: { type: "string", enum: ["low", "medium", "high", "critical"] }
    },
    required: ["package_file"]
  }
}
```

#### tm_create_jira_issues
```typescript
{
  name: "tm_create_jira_issues",
  description: "Create Jira issues for identified gaps",
  inputSchema: {
    type: "object",
    properties: {
      gaps: { type: "array", description: "Gap analysis results" },
      project_key: { type: "string" },
      issue_type: { type: "string", default: "Security Task" }
    },
    required: ["gaps", "project_key"]
  }
}
```

### Resources

#### Threat Catalog
```
URI: threat://catalog/stride
URI: threat://catalog/owasp
URI: threat://catalog/custom/{id}

Returns: JSON array of threat templates with:
- ID, title, category
- Description, prerequisites
- Default risk scores
- Standard countermeasures
```

#### Compliance Frameworks
```
URI: compliance://owasp/2021
URI: compliance://soc2
URI: compliance://pci-dss/4.0
URI: compliance://hipaa
URI: compliance://gdpr

Returns: JSON with:
- Requirements list
- STRIDE mappings
- Control mappings
- Assessment criteria
```

#### Vulnerability Data
```
URI: cve://recent?severity=critical
URI: cve://product/{product_name}
URI: cve://cwe/{cwe_id}

Returns: JSON with:
- CVE details
- CVSS scores
- Affected versions
- Remediation guidance
```

---

## Implementation Plan

### Phase 1: Core MCP Server (v2.0)
- [ ] Create MCP server package
- [ ] Implement tm_discover_assets tool
- [ ] Implement tm_analyze_threats tool
- [ ] Implement tm_verify_controls tool
- [ ] Add threat catalog resources
- [ ] Add compliance framework resources

### Phase 2: External Integrations (v2.1)
- [ ] NVD CVE database integration
- [ ] MITRE ATT&CK mapping
- [ ] GitHub Security Advisories
- [ ] Dependency vulnerability scanning

### Phase 3: Workflow Automation (v2.2)
- [ ] Jira integration for issue creation
- [ ] Slack notifications for findings
- [ ] GitHub Actions integration
- [ ] Webhook delivery for alerts

### Phase 4: Advanced Features (v3.0)
- [ ] Real-time monitoring mode
- [ ] Automated PR reviews
- [ ] Continuous compliance monitoring
- [ ] Dashboard and reporting portal

---

## Skill Updates for Hybrid Mode

### Updated /tm-init Skill

```yaml
---
name: tm-init
description: Initialize threat modeling project
allowed-tools: Read, Write, Glob, mcp__threatmodel__tm_discover_assets
---

# Threat Model Initialization

## Process

When MCP server is available, use:
1. Call `mcp__threatmodel__tm_discover_assets` with docs path
2. Process returned asset inventory
3. Enhance with Claude analysis
4. Write state files

When MCP server is unavailable, fall back to:
1. Direct file analysis with Glob/Read
2. Claude-powered asset extraction
3. Write state files
```

### Updated /tm-threats Skill

```yaml
---
name: tm-threats
description: Analyze threats using STRIDE/PASTA
allowed-tools: Read, Write, mcp__threatmodel__tm_analyze_threats, mcp__threatmodel__threat_catalog
---

# Threat Analysis

## Process

When MCP server is available:
1. Load threat templates from `threat://catalog/stride`
2. Call `mcp__threatmodel__tm_analyze_threats` with assets
3. Enhance results with Claude reasoning
4. Write threat catalog

When MCP server is unavailable:
1. Use embedded STRIDE framework
2. Claude-powered threat enumeration
3. Write threat catalog
```

---

## Configuration

### .mcp.json for Hybrid Mode

```json
{
  "mcpServers": {
    "threatmodel": {
      "command": "npx",
      "args": ["-y", "@threatmodel/mcp-server"],
      "env": {
        "NVD_API_KEY": "${NVD_API_KEY}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}",
        "JIRA_BASE_URL": "${JIRA_BASE_URL}"
      }
    }
  }
}
```

### Environment Variables

```bash
# Vulnerability databases
export NVD_API_KEY=your-nvd-api-key

# Jira integration
export JIRA_API_TOKEN=your-jira-token
export JIRA_BASE_URL=https://your-org.atlassian.net

# Slack notifications
export SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# GitHub integration
export GITHUB_TOKEN=your-github-token
```

---

## Benefits of Hybrid Architecture

| Aspect | Skills Only | Hybrid (Skills + MCP) |
|--------|-------------|----------------------|
| Token usage | High | Reduced (computation offloaded) |
| Speed | Variable | Faster (cached data) |
| Integrations | None | Full (Jira, Slack, etc.) |
| Vulnerability data | Static | Real-time (NVD, GitHub) |
| Offline capability | Full | Graceful degradation |
| CI/CD integration | Manual | Automated |
| Consistency | Varies | Deterministic algorithms |

---

## Migration Path

1. **Current users**: Continue using Skills-only mode
2. **Install MCP server**: `npm install -g @threatmodel/mcp-server`
3. **Add configuration**: Create `.mcp.json` in project
4. **Skills auto-detect**: MCP tools used when available
5. **Graceful fallback**: Skills work without MCP server

---

## Contributing

The MCP server will be developed as a separate package:

```
@threatmodel/mcp-server/
├── src/
│   ├── index.ts          # MCP server entry
│   ├── tools/            # Tool implementations
│   ├── resources/        # Resource providers
│   └── integrations/     # External service clients
├── data/
│   ├── stride.json       # STRIDE templates
│   ├── owasp.json        # OWASP mappings
│   └── cwe.json          # CWE database
└── package.json
```

Contributions welcome for:
- Additional threat frameworks
- New compliance mappings
- Integration adapters
- Vulnerability data sources
