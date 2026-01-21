# Test Cases

Two test cases demonstrating the toolkit for different audiences.

## 1. Simple App (Developer Experience)

**Path:** `./simple-app`

A straightforward task management app. Represents what a typical developer might build.

```bash
cd simple-app
/tm-full --docs ./docs
```

**Characteristics:**
- Simple architecture (React + Express + PostgreSQL)
- Basic security (JWT, bcrypt)
- Some gaps to discover (missing rate limiting, IDOR)
- ~5 assets, ~15 threats
- Analysis time: ~2-3 minutes

---

## 2. Complex System (Security Expert Experience)

**Path:** `./complex-system`

An enterprise financial platform with comprehensive documentation.

```bash
cd complex-system
/tm-full --docs ./docs --compliance owasp,soc2,pci-dss
```

**Characteristics:**
- Microservices architecture (4 services)
- Multiple trust boundaries (5 defined)
- External integrations (Stripe, Plaid, Auth0, etc.)
- PCI-DSS, SOC2, GDPR compliance requirements
- Detailed security controls with code
- ~15 assets, ~40+ threats
- Analysis time: ~5-10 minutes

---

## Quick Comparison

| Aspect | Simple App | Complex System |
|--------|------------|----------------|
| **Target User** | Developer | Security Expert |
| **Assets** | ~5 | ~15-20 |
| **Threats** | ~15 | ~40-50 |
| **Trust Boundaries** | Implicit | 5 defined |
| **Compliance** | N/A | PCI-DSS, SOC2, GDPR |
| **Code Included** | Basic | Comprehensive |
| **Analysis Depth** | Quick overview | Deep analysis |

---

## Testing Each Skill

### `/tm-init`
```bash
cd simple-app && /tm-init --docs ./docs
cd complex-system && /tm-init --docs ./docs
```

### `/tm-threats`
```bash
cd simple-app && /tm-threats
cd complex-system && /tm-threats --framework stride --include-abuse
```

### `/tm-verify`
```bash
cd simple-app && /tm-verify --evidence
cd complex-system && /tm-verify --thorough --evidence
```

### `/tm-compliance`
```bash
cd complex-system && /tm-compliance --framework owasp,soc2,pci-dss
```

### `/tm-report`
```bash
cd complex-system && /tm-report --level detailed
```

### `/tm-drift`
```bash
cd complex-system && /tm-drift --create-baseline
# Make changes to docs, then:
cd complex-system && /tm-drift
```

### `/tm-tests`
```bash
cd simple-app && /tm-tests --format jest
cd complex-system && /tm-tests --format jest
```
