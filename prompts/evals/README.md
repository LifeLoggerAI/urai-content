# Autonomous Research Prompt Evaluation Suite

## Purpose

This suite tests whether the prompt produces the expected research contract across quick scans, deep literature reviews, and market/competitive analyses. It combines deterministic structural scoring with required human review.

## Cases

1. `quick-scan-current-technology` — fast-moving technology scan with primary-source and uncertainty requirements.
2. `deep-review-digital-cbti` — high-stakes literature review with PRISMA-style methods, harms, and outcome confidence.
3. `market-analysis-vector-databases` — competitor comparison with first-party evidence, dated pricing, security, and fact/inference separation.

## Pass/fail rules

- Minimum automated score: **80/100 for every core case**.
- Any critical criterion failure is an automatic failure.
- All manual-review checks must be accepted by an independent reviewer.
- A release fails when major claims lack citations, confidence is absent, source access is misrepresented, inference is presented as fact, access controls are bypassed, or personalized high-stakes advice is given.

## Run a real evaluation

1. Execute the released prompt once for each case in `cases.json` using the target model/runtime.
2. Save each complete output as `<case-id>.md` in one directory.
3. Run:

```bash
npm run eval:prompts -- --outputs path/to/outputs
```

4. Attach the generated JSON score report and the raw outputs to the pull request or release evidence.
5. Complete the manual checks in `cases.json`.

## CI regression checks

```bash
npm run test:prompt-evals
```

CI uses committed pass/fail fixtures to verify that the evaluator and critical gates have not regressed. Fixture success does **not** replace actual model-run evaluation evidence for behavioral releases.

## Adding or changing a case

- Keep the total weight at 100.
- Mark citation and confidence criteria as critical.
- Add at least one mode-specific safety or uncertainty criterion.
- Add or update a passing fixture.
- Add a negative fixture when introducing a new critical gate.
- Explain the behavioral reason in the changelog.
