# THE UNKNOWN / Episode 01 — reproducibility R7

This **finite computational investigation is not a proof of any unbounded conjecture**. It packages and independently reruns the exact algorithms behind the episode.

## Run locally (Python 3.8+, C compiler optional)

```sh
python3 -m unittest -v test_finite_math.py
python3 verify_finite_math.py --expect-million --output finite-math-receipt.json
gcc -O2 -Wall -Wextra verify_collatz.c -o verify_collatz
./verify_collatz
```

## Expected bounded results (inclusive upper bound = 1,000,000)
- Goldbach: **499,999** even integers from 4 through 1,000,000 checked; no counterexample found in that interval.
- Primes: **78,498** through 1,000,000.
- Twin-prime pairs: **8,169** pairs (p,p+2) with p+2 no greater than 1,000,000.
- Collatz: all starting values **1–1,000,000** reached 1; maximum **524 steps** (start **837,799**).
- Negative-control test deliberately alters the known expected twin-prime count to make sure a mismatch is caught. This is a test assertion, not a formal proof certificate.

## R7 independent checks
- Four Python unit tests + million-bound run PASS in the local environment and **both existing Runpod mathematics Pods** (`s7qtswsau8cz04`, `vte8dulw9ya14g`).
- Each Pod fetched the three source files from this exact GitHub review branch and **verified SHA-256** before executing them.
- The separately implemented C recurrence locally agreed with the Python finite Collatz result.
- Receipt JSON contains runtime and elapsed duration, so **receipt hashes differ** across environments; compare the `result` fields rather than the entire byte stream.

## Source hashes (SHA-256)
- `verify_finite_math.py`: `5e058571ed8bf220629bfa3168f3012109d0c600d1d8fc0803ce8c690901b992`
- `verify_collatz.c`: `0044f8e3e13e81287ae5deb9dd6a76793a6a176b28e96aaaf18d89291e0a8268`
- `test_finite_math.py`: `d94570eaebd79852290e5770e040e0813cb8974f35f932c6f1c0bd1ee7b6f0e3`

## Limitations and attribution
- These finite checks **do not** establish Goldbach's conjecture, the Collatz conjecture, or infinitely many twin primes. Cross-worker reproduction is not independent expert peer review.
- The Riemann Hypothesis episode should credit Levent Alpöge and Claude for their separate work; it is **not** an UrAi-origin proof. https://leanprover-community.github.io/blog/posts/riemann-hypothesis/
- The Episode 01 video has **no spoken narration**, only instrumental music. Its English WebVTT is an approximate guide to static on-screen cards; for screen-reader accessibility, include a plain-language full text transcript. Before publishing on YouTube, independently review transcript and caption accuracy.
- The GitHub PR remains **draft/unmerged**. UrAi Genesis production and private-memory writes remain on HOLD.

Research ledger: https://github.com/LifeLoggerAI/urai-labs-llc/issues/488
