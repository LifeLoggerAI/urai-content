# Google Doc ↔ GitHub Content Parity

## Result

**Status: SOURCE VERIFIED — RELEASE BLOCKED**

The collaboration mirror is now bound to an immutable, readable `text/plain` snapshot committed in this branch. CI no longer accepts two matching metadata strings as parity evidence.

- Version: `1.0.0`
- Google Doc ID: `1dnIErxoHoIqpqR9uyYuR6rphdZv8h5VOpxZEwZ-g1c4`
- Exact Drive revision: `ALtnJHyCtNBrFmtFrqzaXtYs5iClC2gF9e0Hq2w1SPBEIqh18EH37RZialJC42ZhQde52aMZLH29JK-bANunaMxE2h4bp6G5VU8lfSf0kt4`
- Export format: `text/plain`
- Sync date: `2026-07-11`
- Normalized full-export SHA-256: `b2e63e22c385a9111dabb79d7e35e2d71f98cc13a6b9abfd8187368198ff69bc`
- Canonical source SHA-256: `c4dfdd2ed942649aec4cd79f38f7fe358d6581dcac89fed413395b11e58b0ea5`

The canonical hash normalizes line endings, removes one leading UTF-8 BOM, and excludes only the line beginning `Source export SHA-256:`. That exclusion is necessary because the Google Doc embeds its own prior hash, making a literal full-document hash self-referential. Every other byte remains in scope.

The prompt frontmatter still contains the prior self-reported value `d2fe8fe5754296bcf7b5f22665e2051221e5dd003f938fd5987921b9c6abddfa`. It is retained only as legacy document metadata and is explicitly **not authoritative evidence**. The ordered snapshot files, their individual SHA-256 values, the exact Drive revision, and the recomputed canonical hash are authoritative.

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

The check now validates:

- every ordered source-snapshot file and its exact SHA-256;
- normalized full-export and canonical source hashes;
- exact Google Doc document and revision identity;
- the explicit self-reference exclusion rule;
- required sections and representative content anchors;
- version consistency, evaluation schema, fixtures, and local Markdown links.

A source file change, missing part, reordered part, substituted hash, stale revision, missing anchor, or inconsistent version fails CI.

This source verification does not satisfy the separate release gates. Current-head CI, actual model-run evidence where required, manual checks, independent non-author approval, merge, release tag, and post-merge mirror synchronization remain mandatory.
