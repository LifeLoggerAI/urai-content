# Publishing Proof

Starting SHA: 4366390d7691d0cf5b3e728f2452c729a75b893f
Ending SHA: final branch head after proof commits; see PR/final response.
Branch: production-lock-content-2026-06-30
Evidence scope: source-level inspection.

## Source-level status

Status: PARTIAL.

Real source foundations exist:

- Workflow statuses: draft, review, approved, published, archived.
- ContentService create and update validate content through Zod.
- ContentService adds versions on create and update.
- transitionWorkflow enforces allowed transitions.
- Publishing transition logs a release record through repository interface.
- Published content search filters by status and visibility.

## Missing production evidence

- Deployed publishing UI.
- Provider-backed Firestore write/read/release log proof.
- Browser E2E for full content workflow.
- Audit/provenance proof.
- Rollback runbook evidence.

## Production rule

Publishing must remain PARTIAL until provider-backed persistence, role proof, release logs, and deployed browser/API tests exist.
