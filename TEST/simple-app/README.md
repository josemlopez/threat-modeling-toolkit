# Test Case: Simple App (Developer Experience)

This test case demonstrates the **developer experience** - a simple task management app that a typical developer might build.

## What's Included

```
simple-app/
├── docs/
│   ├── README.md      # Basic architecture overview
│   └── api.md         # API endpoint documentation
└── src/
    ├── middleware/
    │   ├── auth.js       # JWT authentication
    │   └── rateLimiter.js # Rate limiting (partial)
    └── routes/
        ├── auth.js       # Auth routes (login, register, forgot-password)
        └── tasks.js      # Task CRUD routes
```

## How to Test

From the `simple-app` directory:

```bash
# Initialize threat model
/tm-init --docs ./docs

# Run threat analysis
/tm-threats

# Verify controls in code
/tm-verify --evidence

# Or run everything at once
/tm-full --docs ./docs
```

## Expected Findings

The toolkit should discover:

### Assets
- React frontend
- Express API
- PostgreSQL database
- JWT authentication
- SendGrid integration

### Gaps (Intentionally Included)
1. **Missing rate limiting on `/forgot-password`** - Login has rate limiting, but password reset doesn't
2. **Missing object-level authorization** - Task update/delete doesn't verify ownership
3. **No MFA implementation** - Single-factor authentication only
4. **No CSRF protection** - Missing in task operations

## Complexity Level

- **Assets**: ~5
- **Data Flows**: ~8
- **Threats**: ~15-20
- **Time to analyze**: ~2-3 minutes

This represents a typical developer project where security was considered but some gaps remain.
