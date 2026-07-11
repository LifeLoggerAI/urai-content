# Prompt Synchronization Workflow

## Authority decision

**GitHub is the authoritative source of truth.** The Google Doc is a collaboration and review mirror.

This choice provides immutable history, pull-request review, automated checks, release tags, and reliable rollback. A Google Doc edit does not change the released prompt until the change is ported to GitHub, reviewed, evaluated, merged, and versioned.

## Standard change flow

1. Create a GitHub branch from `main`.
2. Update the prompt, version metadata, changelog, parity manifest, and evaluation cases.
3. Export the Google Doc mirror as `text/plain` and record its exact Drive document ID and revision ID.
4. Commit the readable export as ordered source-snapshot parts. Do not use an opaque archive as the only parity evidence.
5. Record each part SHA-256, the normalized full-export SHA-256, and the canonical source SHA-256 in `prompts/parity-manifest.json`.
6. Canonicalization may exclude only the self-referential line beginning `Source export SHA-256:`; all other exported bytes remain in scope.
7. Run `npm run check:prompts` and `npm run test:prompt-evals`.
8. Run the prompt against the representative evaluation cases and save the outputs in an approved evidence location.
9. Score outputs with `npm run eval:prompts -- --outputs <directory>`.
10. Open a pull request and attach the evaluation and parity reports.
11. Obtain at least one approving current-head review from an eligible human collaborator who is not the author.
12. Merge only after required checks pass.
13. Create the release tag when the behavioral contract or published version changes.
14. Copy the merged GitHub content to the Google Doc mirror.
15. Export the resulting mirror again and update the exact revision, source snapshot, hashes, parity report, and Google Doc document-control block in the same release cycle.

## Google Doc-originated edits

Edits may begin in Google Docs for collaboration, but they remain proposals. Before release:

- export the exact Drive revision into a GitHub branch;
- commit the readable source snapshot and its part hashes;
- resolve formatting differences in Markdown;
- update tests and version metadata;
- complete the normal review and evaluation flow;
- overwrite the Google Doc mirror from the merged GitHub version.

## Conflict rule

When GitHub and Google Docs disagree, GitHub wins. Do not merge the documents manually without opening a GitHub change. Restore the mirror from the latest released GitHub version, then re-propose any desired Doc-only changes through a pull request.

## Sync acceptance checklist

- [ ] GitHub version and Google Doc version match.
- [ ] `last_synced` dates match.
- [ ] Exact Google Doc document and revision IDs are recorded.
- [ ] Every readable source-snapshot part exists and matches its SHA-256.
- [ ] Normalized full-export and canonical source hashes recompute successfully.
- [ ] Prompt section and anchor parity passes.
- [ ] Legacy self-reported hash metadata is not treated as authoritative evidence.
- [ ] Changelog contains the release.
- [ ] Actual model-run evaluation evidence is attached when governance requires it.
- [ ] Manual checks and independent current-head approval are complete.
- [ ] The Google Doc document-control section links back to GitHub.
