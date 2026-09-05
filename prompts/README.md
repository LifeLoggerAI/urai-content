# Prompt Library

Reusable, version-controlled prompts for URAI research, content, and agent workflows.

## Current release

- **Version:** `1.0.0`
- **Source of truth:** GitHub
- **Last synchronized:** July 11, 2026
- **Collaboration mirror:** [Google Docs](https://docs.google.com/document/d/1dnIErxoHoIqpqR9uyYuR6rphdZv8h5VOpxZEwZ-g1c4/edit)
- **Version-controlled prompt:** [Autonomous Research Agent Master Prompt](./autonomous-research-agent-master-prompt.md)
- **Parity status:** [PASS](./PARITY.md)

## Library contents

- [Autonomous Research Agent Master Prompt](./autonomous-research-agent-master-prompt.md) — full report, master prompt, specialized templates, runtime plan, and customization guide.
- [Usage Guide](./USAGE.md) — mode selection and operating instructions.
- [Evaluation Suite](./evals/README.md) — representative cases, scoring, fixtures, and release evidence workflow.
- [Content Parity Report](./PARITY.md) — Google Doc-to-GitHub section verification and source hash.
- [Synchronization Workflow](./SYNC.md) — authority, update flow, conflict rules, and acceptance checklist.
- [Governance Policy](./GOVERNANCE.md) — ownership, review gates, versioning, approvals, and rollback.
- [Changelog](./CHANGELOG.md) — release history.

## Commands

```bash
npm run check:prompts
npm run test:prompt-evals
npm run eval:prompts -- --outputs <directory>
```

## Maintenance rules

- Treat prompt changes like application-code changes: branch, review, evaluate, version, and preserve rollback history.
- GitHub is authoritative; the Google Doc is updated after merge.
- Behavioral changes require independent approval and passing prompt checks.
- Update the version and synchronization date whenever the published behavioral contract changes.
