# Prompt Synchronization Workflow

## Authority decision

**GitHub is the authoritative source of truth.** The Google Doc is a collaboration and review mirror.

This choice provides immutable history, pull-request review, automated checks, release tags, and reliable rollback. A Google Doc edit does not change the released prompt until the change is ported to GitHub, reviewed, evaluated, merged, and versioned.

## Standard change flow

1. Create a GitHub branch from `main`.
2. Update the prompt, source snapshot when applicable, version metadata, changelog, parity manifest, and evaluation cases.
3. Run `npm run check:prompts` and `npm run test:prompt-evals`.
4. Run the prompt against the representative evaluation cases and save the outputs outside the repository or in an approved evidence location.
5. Score outputs with `npm run eval:prompts -- --outputs <directory>`.
6. Open a pull request and attach the evaluation report.
7. Obtain at least one approving review from the prompt CODEOWNER. The author cannot be the sole approver.
8. Merge only after required checks pass.
9. Create the release tag when the behavioral contract or published version changes.
10. Copy the merged GitHub content to the Google Doc mirror.
11. Update `last_synced`, the source hash, parity report, and Google Doc document-control block in the same release cycle.

## Google Doc-originated edits

Edits may begin in Google Docs for collaboration, but they remain proposals. Before release:

- export or copy the edits into a GitHub branch;
- resolve formatting differences in Markdown;
- update tests and version metadata;
- complete the normal review and evaluation flow;
- overwrite the Google Doc mirror from the merged GitHub version.

## Conflict rule

When GitHub and Google Docs disagree, GitHub wins. Do not merge the documents manually without opening a GitHub change. Restore the mirror from the latest released GitHub version, then re-propose any desired Doc-only changes through a pull request.

## Sync acceptance checklist

- [ ] GitHub version and Google Doc version match.
- [ ] `last_synced` dates match.
- [ ] Prompt section parity passes.
- [ ] Source SHA-256 metadata matches `parity-manifest.json` and prompt frontmatter.
- [ ] Changelog contains the release.
- [ ] Evaluation evidence is attached to the release or pull request.
- [ ] The Google Doc document-control section links back to GitHub.
