## Tweet 1 (Hook)

I open-sourced a threat modeling toolkit for Claude Code.

Threat modeling inside your dev tools. No new UI. No separate platform.

Here's what it does 🧵

---

## Tweet 2 (The Problem)

The problem with threat modeling:

Specialized tools. Separate workflows. Frameworks that don't speak developer.

Most devs skip it—not because they don't care about security, but because the tooling lives outside their world.

---

## Tweet 3 (The Solution)

The solution: threat modeling where you already work.

Slash commands in Claude Code. The same place you write and review code.

`/tm-full --docs ./docs`

That's it.

---

## Tweet 4 (For Developers)

For developers:

Claude reads your architecture docs, identifies what you're building, applies threat analysis, and checks if your code has the right controls.

No security background needed. Just run the command.

---

## Tweet 5 (For Security Pros)

For security professionals:

Go as deep as you need. Complex trust boundaries, attack trees, multiple compliance frameworks, control verification with file:line evidence.

The toolkit scales with your expertise.

---

## Tweet 6 (Discovery)

`/tm-init` reads your docs and extracts:

→ Assets (services, databases, integrations)
→ Data flows (protocols, encryption, auth)
→ Trust boundaries
→ Attack surface (APIs, UIs, webhooks)

Plus generates Mermaid diagrams automatically.

---

## Tweet 7 (Threats)

`/tm-threats` applies STRIDE to every component:

- Spoofing
- Tampering
- Repudiation
- Information Disclosure
- Denial of Service
- Elevation of Privilege

Each threat gets a risk score, MITRE ATT&CK mapping, and required countermeasures.

---

## Tweet 8 (Verification)

`/tm-verify` is where it gets interesting.

It searches your CODEBASE to check if controls actually exist.

Real output:
```
✓ Implemented: 5  (33%)
⚠ Partial:     3  (20%)
✗ Missing:     7  (47%)

[GAP-001] BOLA on task update
  File: src/routes/tasks.js:44
```

Evidence, not assumptions.

---

## Tweet 9 (Compliance)

`/tm-compliance` maps everything to frameworks:

```
OWASP Top 10 2021:
  A01 Broken Access Control: ██░░░░░░░░ 15% NON-COMPLIANT
  A02 Crypto Failures:       █████████░ 90% COMPLIANT
  A03 Injection:             ███████░░░ 70% PARTIAL
  Overall: 52%
```

Auditors love traceable evidence.

---

## Tweet 10 (Drift)

`/tm-drift` compares current state to baseline.

New component added? Flagged.
Control removed? You'll know.
Configuration changed? Detected.

Your threat model evolves with your code.

---

## Tweet 11 (Tests)

`/tm-tests` generates security test cases:

```javascript
it('should block after 5 failed login attempts', async () => {
  // ... attack scenario test
  expect(response.status).toBe(429);
});
```

29 tests from 15 threats. Add to CI/CD.

---

## Tweet 12 (Full Workflow)

Or just run everything at once:

```
/tm-full --docs ./docs --compliance owasp,soc2
```

Real output:
✓ 5 assets discovered
✓ 15 threats analyzed
✓ 15 controls verified
✓ Compliance mapped
✓ Report generated

---

## Tweet 13 (Install)

Install it:

```
/install github:josemlopez/threat-modeling-toolkit
```

Repo: https://github.com/josemlopez/threat-modeling-toolkit

MIT licensed. PRs welcome.

---

## Tweet 14 (CTA)

Threat modeling shouldn't require leaving your dev environment or learning a separate tool.

This brings it to where you already work.

Try it. Tell me what's missing.
