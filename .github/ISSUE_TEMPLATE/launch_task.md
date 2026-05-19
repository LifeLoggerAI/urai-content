---
name: Launch task
description: Track production-readiness work with evidence gates
title: "[Launch]: "
labels: ["launch-control"]
assignees: []
---

## Scope

```text
Scope type: package / web-runtime / Firebase / auth / Stripe / export / deployment / observability / docs
Launch lane:
Related doc(s):
Expected status change: RED -> YELLOW / YELLOW -> GREEN / no status change
```

## Problem / goal


## Acceptance criteria

- [ ] 

## Evidence required before GREEN

- [ ] Commit SHA
- [ ] CI run URL
- [ ] Commands run
- [ ] Test output
- [ ] Smoke output, if applicable
- [ ] Deployed URL, if applicable
- [ ] Provider evidence, if applicable
- [ ] Updated docs, if applicable

## Security / privacy impact

- [ ] No secrets committed
- [ ] Auth/admin routes fail closed where applicable
- [ ] Draft/private content is not publicly exposed
- [ ] Entitlements cannot be bypassed client-side
- [ ] Export artifacts are ownership-protected
- [ ] Stripe webhook signatures are verified where applicable
- [ ] N/A

## Stop rules

Do not mark GREEN if evidence is missing, CI fails without approved override, secrets are uncertain, auth fails open, exports can leak, Stripe is unverified, deployment smoke fails, or rollback is missing for deployment work.

## Owner / next action

```text
Owner:
Next action:
Current status: RED / YELLOW / GREEN
```
