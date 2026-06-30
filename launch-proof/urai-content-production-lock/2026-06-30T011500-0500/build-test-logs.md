# Build and Test Logs

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: command attempt plus blocked status.

## Local execution attempt

Attempted command:

```bash
rm -rf /mnt/data/urai-content && git clone https://github.com/LifeLoggerAI/urai-content.git /mnt/data/urai-content
```

Result: BLOCKED.

Error:

```text
fatal: unable to access 'https://github.com/LifeLoggerAI/urai-content.git/': Could not resolve host: github.com
```

## Required root commands

- npm ci — BLOCKED, local clone unavailable.
- npm run lint — BLOCKED, local clone unavailable.
- npm run typecheck — BLOCKED, local clone unavailable.
- npm test — BLOCKED, local clone unavailable.
- npm run build — BLOCKED, local clone unavailable.
- npm run validate:content — BLOCKED, local clone unavailable.
- npm run validate:sprites — BLOCKED, local clone unavailable.
- npm run content:index — BLOCKED, local clone unavailable.
- npm run seed:check — BLOCKED, local clone unavailable.
- npm run seed:system:check — BLOCKED, local clone unavailable.
- npm run check:governance — BLOCKED, local clone unavailable.
- npm run check:secrets — BLOCKED, local clone unavailable.
- npm run check:ecosystem — BLOCKED, local clone unavailable.
- npm run check — BLOCKED, local clone unavailable.

## Required web commands

- npm run web:install — BLOCKED, local clone unavailable.
- npm run web:check — BLOCKED, local clone unavailable.
- npm run web:smoke:routes — BLOCKED, local clone unavailable.
- npm run web:e2e — BLOCKED, local clone unavailable.

## Required CI action

The PR must run CI before merge. Do not mark source fixes GREEN until CI passes.
