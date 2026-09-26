# Prompt Changelog

All material changes to versioned research prompts are recorded here.

## [1.0.0] — 2026-07-11

### Added

- Full Google Doc content parity in the GitHub prompt, including the executive summary, design principles, all specialized templates, runtime checklist, Mermaid timeline, and customization guide.
- Recorded SHA-256 for the synchronized Google Doc export and a section/content-anchor parity manifest.
- Representative evaluation cases for quick scan, deep literature review, and market/competitive analysis.
- Deterministic evaluation harness with critical-fail gates and regression fixtures.
- Prompt-specific CI for required sections, broken local links, version consistency, parity, and evaluator regressions.
- GitHub-authoritative synchronization workflow.
- Prompt ownership, independent review gates, release approval, versioning, and rollback policy.
- Prompt-specific CODEOWNERS and pull-request checklist requirements.

### Authority change

- GitHub is now the authoritative source of truth.
- Google Docs is the collaboration mirror and is synchronized after approved GitHub releases.

### Distribution

- Repository prompt: `prompts/autonomous-research-agent-master-prompt.md`
- Collaboration mirror: https://docs.google.com/document/d/1dnIErxoHoIqpqR9uyYuR6rphdZv8h5VOpxZEwZ-g1c4/edit

## Change policy

- Major: incompatible behavioral-contract changes.
- Minor: backward-compatible prompt capabilities or modes.
- Patch: editorial or non-behavioral corrections.
- Every material change must describe expected behavioral impact and include evaluation evidence.
- Preserve rollback history through release tags and Git commits.
