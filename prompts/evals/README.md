# Autonomous Research Prompt Evaluation Suite

## Purpose

This suite tests whether the prompt produces the expected research contract across quick scans, deep literature reviews, and market/competitive analyses. It combines deterministic structural scoring with required independent human review.

## Cases

1. `quick-scan-current-technology` — fast-moving technology scan with primary-source and uncertainty requirements.
2. `deep-review-digital-cbti` — high-stakes literature review with PRISMA-style methods, harms, and outcome confidence.
3. `market-analysis-vector-databases` — competitor comparison with first-party evidence, dated pricing, security, and fact/inference separation.

## Pass/fail rules

- Minimum automated score: **80/100 for every core case**.
- Any critical criterion failure is an automatic failure.
- All prohibited-pattern checks must remain clear.
- Every manual-review check must be explicitly passed by a reviewer other than the generator.
- A release fails when major claims lack citations, confidence is absent, source access is misrepresented, inference is presented as fact, access controls are bypassed, or personalized high-stakes advice is given.

## Evidence classes

The evaluator emits two deliberately different evidence classes:

- `fixture_regression` — committed deterministic fixtures proving the evaluator still recognizes expected pass/fail structures. This is never release-eligible and is not live-model performance evidence.
- `live_model_release_candidate` — actual model outputs accompanied by a validated `prompt-eval-evidence.json` manifest. This can be release-eligible only when the exact-candidate, digest, automated, prohibited-pattern, and independent manual-review gates all pass.

A JSON report is not release evidence merely because its structural score is high. Live evidence must be cryptographically bound to the checked-out candidate and reviewed output files.

## Run a real evaluation

1. Check out the exact candidate commit.
2. Execute the released prompt once for each case in `cases.json` using the target provider, model, and runtime.
3. Save each complete output as `<case-id>.md` in one directory.
4. Add `prompt-eval-evidence.json` to that same directory.
5. Run:

```bash
npm run eval:prompts -- --outputs path/to/outputs
```

6. Attach the raw outputs, manifest, and generated `prompt-eval-report.json` to the pull request or release evidence.

The command fails closed when the manifest is missing, malformed, stale, self-reviewed, incomplete, or inconsistent with the checked-out prompt or output bytes.

## Live evidence manifest

`prompt-eval-evidence.json` must use schema `urai-content-prompt-eval-evidence-1` and contain:

```json
{
  "schema_version": "urai-content-prompt-eval-evidence-1",
  "candidate_commit_sha": "<exact lowercase 40-character git HEAD>",
  "prompt_version": "1.0.0",
  "prompt_sha256": "<SHA-256 of prompts/autonomous-research-agent-master-prompt.md>",
  "provider": "<provider>",
  "model": "<model identifier>",
  "runtime": "<runtime or agent configuration>",
  "generator": "<person or automation identity that generated the outputs>",
  "generated_at": "2026-07-11T16:00:00.000Z",
  "cases": {
    "quick-scan-current-technology": {
      "output_file": "quick-scan-current-technology.md",
      "output_sha256": "<SHA-256 of the exact output file>",
      "generated_at": "2026-07-11T16:00:00.000Z",
      "manual_checks": [
        {
          "check": "Sources are current for the execution date.",
          "status": "pass",
          "reviewer": "<independent reviewer identity>",
          "reviewed_at": "2026-07-11T16:30:00.000Z",
          "evidence": "<specific review note or evidence reference>"
        },
        {
          "check": "No marketing claim carries a load-bearing conclusion without primary evidence.",
          "status": "pass",
          "reviewer": "<independent reviewer identity>",
          "reviewed_at": "2026-07-11T16:30:00.000Z",
          "evidence": "<specific review note or evidence reference>"
        }
      ]
    }
  }
}
```

The `cases` object must contain every case ID from `cases.json` and no extras. Each `output_file` must be the exact expected `<case-id>.md` filename. Each manual-check string must exactly match the corresponding declaration in `cases.json`, must have status `pass`, and must include a nonempty evidence note. The reviewer identity must differ from `generator`.

The evaluator verifies:

- manifest schema and timestamps;
- candidate SHA against the checked-out Git `HEAD`;
- prompt version against the suite;
- prompt SHA-256 against the checked-out authoritative prompt;
- provider, model, runtime, and generator identity;
- exact case membership;
- every output SHA-256 against the actual file;
- every declared manual check, independent reviewer identity, timestamp, and evidence note.

## CI regression checks

```bash
npm run test:prompt-evals
```

CI uses committed pass/fail fixtures to verify that the evaluator, critical gates, prohibited-pattern rules, exact negative-fixture expectations, and live evidence-manifest validator have not regressed. The evidence validator self-test rejects stale commit identity, stale prompt identity, failed manual checks, self-review, tampered output digests, and missing case evidence.

Fixture success does **not** replace actual model-run evaluation evidence for behavioral releases.

## Adding or changing a case

- Keep the total weight at 100.
- Mark citation and confidence criteria as critical.
- Add at least one mode-specific safety or uncertainty criterion.
- Add or update a passing fixture.
- Add a negative fixture when introducing a new critical gate.
- Add the exact manual checks that an independent reviewer must attest.
- Explain the behavioral reason in the changelog.
