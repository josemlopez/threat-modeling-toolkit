# Threat Model Drift Report

**Project**: TaskFlow
**Current Date**: 2026-01-20
**Baseline**: Initial (No previous baseline)

---

## Summary

This is the **initial baseline** for the TaskFlow threat model. No previous baseline exists for comparison.

| Category | Current State |
|----------|---------------|
| Assets | 5 |
| Data Flows | 8 |
| Attack Surface | 8 entries |
| Trust Boundaries | 4 |
| Threats | 15 |
| Controls | 15 (5 implemented) |
| Gaps | 10 |

---

## Initial State Captured

### Assets (5)

| ID | Name | Type | Classification |
|----|------|------|----------------|
| asset-001 | React Frontend | client | public |
| asset-002 | Express API | service | internal |
| asset-003 | PostgreSQL Database | data-store | restricted |
| asset-004 | JWT Authentication | identity | confidential |
| asset-005 | SendGrid Integration | integration | internal |

### Attack Surface (8 entries)

| Exposure | Count | Endpoints |
|----------|-------|-----------|
| Public | 3 | /auth/register, /auth/login, /auth/forgot-password |
| Internal | 5 | /tasks (CRUD), /users/me |

### Trust Boundaries (4)

1. **TB-001**: Public Internet → API (network)
2. **TB-002**: API → Database (network)
3. **TB-003**: API → External Services (organizational)
4. **TB-004**: Authentication Boundary (privilege)

### Threat Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 7 |
| Medium | 4 |
| Low | 0 |
| **Total** | **15** |

### Control Status

| Status | Count |
|--------|-------|
| Implemented | 5 |
| Partial | 3 |
| Missing | 7 |
| **Total** | **15** |

### Gap Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 5 |
| Medium | 2 |
| **Total** | **10** |

### Compliance Baseline

| Framework | Coverage |
|-----------|----------|
| OWASP Top 10 | 52% |
| SOC2 Trust Services | 48% |

---

## Monitoring Recommendations

Future drift detection will compare against this baseline to identify:

1. **New Assets** - Components added to the system
2. **Removed Assets** - Components decommissioned
3. **Attack Surface Changes** - New or modified endpoints
4. **Control Degradation** - Implemented controls becoming partial/missing
5. **New Threats** - Threats introduced by changes
6. **Compliance Drift** - Coverage changes in frameworks

---

## Baseline File

Created: `.threatmodel/baseline/snapshot-20260120.json`

---

## Next Steps

1. Address the 10 identified gaps
2. Run `/tm-drift` after making changes to track progress
3. Create new baselines at major milestones:
   - After critical gap remediation
   - Before/after releases
   - During security audits

---

## Change Tracking Schedule

Recommended drift detection frequency:

| Trigger | Action |
|---------|--------|
| After code changes | Run `/tm-drift` |
| Weekly | Scheduled drift check |
| Before release | Create baseline snapshot |
| After security incident | Run full analysis |
