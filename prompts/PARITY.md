# Google Doc ↔ GitHub Content Parity

## Result

**Status: PASS**

The GitHub prompt contains every substantive section present in the synchronized Google Doc export. The verified export hash is recorded for reproducibility, while CI enforces section and content-anchor parity.

- Version: `1.0.0`
- Sync date: `2026-07-11`
- SHA-256: `d2fe8fe5754296bcf7b5f22665e2051221e5dd003f938fd5987921b9c6abddfa`

## Section matrix

| Google Doc section | GitHub location | Status |
|---|---|---|
| Executive summary | `#executive-summary` | Present |
| Design principles | `#design-principles` | Present |
| Copy-paste master prompt | `#copy-paste-master-prompt` | Present |
| Adaptable templates | `#adaptable-templates` | Present |
| Quick scan template | `#quick-scan-template` | Present |
| Deep literature review template | `#deep-literature-review-template` | Present |
| Market and competitive analysis template | `#market-and-competitive-analysis-template` | Present |
| Checklist and runtime plan | `#checklist-and-runtime-plan` | Present |
| Run-readiness checklist | `#run-readiness-checklist` | Present |
| Milestones and estimated effort | `#milestones-and-estimated-effort` | Present |
| Sample Mermaid timeline | `#sample-mermaid-timeline` | Present; reconstructed as executable Mermaid |
| Sample runtime plan | `#sample-runtime-plan-for-a-deep-literature-review` | Present |
| Customization guide | `#customization-guide` | Present |
| Document control | `#document-control` | Present |

## Automated verification

Run:

```bash
npm run check:prompts
```

The check validates required sections, representative content anchors, source-hash metadata consistency, version consistency, evaluation-suite schema, and local Markdown links. Any missing section or inconsistent metadata fails CI.
