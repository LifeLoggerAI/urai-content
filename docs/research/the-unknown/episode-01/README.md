# THE UNKNOWN — Mathematics Episode 01 (review-only)

**URAI LABS × CHALK & CHEESE** | Research media, NOT Genesis production

## Scope
A 39.25-second vertical H.264/AAC mathematics Short and a separate static media preview. This branch is for **review only**; it must not be merged or deployed to the existing `urai-content` production project. The preview is intended for a standalone, protected Vercel project.

## Verified experiments
- Goldbach: all 499,999 even integers from 4 through 1,000,000 checked; no counterexamples found.
- Collatz: starting values 1 through 1,000,000 checked; all reached 1. Maximum 524 steps, starting at 837,799.
- Twin primes: 8,169 pairs through 1,000,000.
- Two independent implementations agreed for the bounded numerical experiments.
- Ramsey R(4,6), K36 solver run: TIMEOUT/INCONCLUSIVE. No new theorem claim.

**Finite computational checks do not prove unbounded conjectures.** The video contains this disclaimer.

Research evidence: https://github.com/LifeLoggerAI/urai-labs-llc/issues/488

## Riemann verification credit
In November 2026 Levent Alpöge published a formal proof with Claude. Lean/Mathlib communities certified the Lean proof, while explanation and broader review continue. URAI Labs did not produce that proof. Official statement: https://leanprover-community.github.io/blog/posts/riemann-hypothesis/
Clay status: https://www.claymath.org/millennium/Riemann-Hypothesis/

## Source-locked media
The 1080×1920 39.250-sec MP4, 16:9 thumbnail and complete source ZIP have been backed up privately in the user's Google Drive mathematics media folder. The private binary media is intentionally *not* committed to this public repository; the standalone Vercel preview carries a copy solely for review.
- MP4 SHA-256: `62ca5b3f74f55a48fc4d39d7dff8879dd6df78983bb264b26573965416eb7b9d`
- ZIP SHA-256: `37482ee50f375e2f58f6f8b15b167583589ee145ee50878ce56bb948b65c8e05`
- Render source SHA-256: `852f3183e2122a28e41da18a27d5a15699b325eb68e63366ba41a78216b1de42`
- Runpod replay separate MP4 SHA-256: `9092dd1068bbde05c9f286c719de0b19836e51ca9ffe9362a5e0ebeb352b12d0` (same duration and codecs, not byte-identical across environments)

## Release gates
- [x] Finite experimental verification and independent implementation checks
- [x] Original master video inspected and decoded without errors
- [x] Brand based on canonical `urai-spatial` SVG, unchanged
- [x] Private Drive archive and readback
- [ ] Protected preview deployment and smoke test
- [x] Ten contiguous English timed-text cues match the 39.250-second video; media player has a captions track
- [ ] Human review of claims, music level, mobile legibility and caption accuracy
- [ ] Public YouTube upload (not authorized/executed in this branch)
- [ ] Any production promotion (BLOCKED for Genesis, out of scope)

All branches, reviews and previews are separate from ONE URAI Genesis security gates; no private-memory writes, IAM changes or production deploys.
