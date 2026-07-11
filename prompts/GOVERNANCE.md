# Prompt Governance and Release Policy

## Ownership

- **Accountable owner and CODEOWNER:** `@LifeLoggerAI`
- **Operational steward:** the maintainer assigned by `@LifeLoggerAI` for the release
- **Required independent reviewer:** at least one repository maintainer or designated prompt reviewer who is not the change author

The CODEOWNER owns behavioral quality, release approval, rollback decisions, and synchronization of the Google Doc mirror.

## Change classes

| Change class | Version impact | Examples | Required evidence |
|---|---:|---|---|
| Editorial | Patch | Typos, formatting, non-behavioral clarification | Static checks and reviewer confirmation |
| Backward-compatible behavior | Minor | New optional mode, new output format, stronger validation without removing capability | Full representative eval suite and comparison to prior release |
| Behavioral contract change | Major | Changed source hierarchy, safety rule, default scope, output contract, or removed capability | Full eval suite, red-team cases, migration note, explicit owner approval |

## Mandatory review gates

A change affecting `prompts/**`, prompt validators, evaluation cases, or prompt CI must satisfy all of the following:

1. GitHub pull request; no unreviewed direct-to-`main` behavioral edits.
2. Prompt CODEOWNER requested and at least one independent approval.
3. `Prompt library validation` CI passes.
4. `npm run check:prompts` passes locally or in CI.
5. `npm run test:prompt-evals` passes.
6. Material changes include actual model-run evaluation evidence and a scored report.
7. Version, changelog, parity manifest, and Google Doc mirror are updated when required.
8. No unresolved critical-fail evaluation finding.

## Release approval process

1. The author proposes the version and explains the behavioral impact.
2. The evaluator runs all representative cases on the intended model/runtime.
3. The independent reviewer checks failures, citations, uncertainty handling, safety, and regression risk.
4. The CODEOWNER approves or rejects the release.
5. After merge, create a `vMAJOR.MINOR.PATCH` tag at the merged commit.
6. Synchronize the Google Doc mirror and record the commit/tag in its document-control section.
7. Retain the previous tag for immediate rollback.

## Pass criteria

A release passes when:

- every core case scores at least 80/100;
- no critical gate fails;
- all manual-review items are accepted;
- parity and version checks pass;
- broken local links are absent;
- the reviewer confirms no unsupported claims were introduced by the prompt change.

## Rollback

Rollback to the most recent known-good tag when a released prompt causes a critical safety, citation, scope, or reliability regression. Open a follow-up issue and preserve the failed release artifacts for diagnosis.

## Bootstrap note

The v1.0.0 hardening release establishes these controls. Future behavioral changes must follow this policy without a bootstrap exception.
