# Content frozen rules-tooling admission — 2026-10-07

This bounded donor starts from Content convergence owner #96 at `2355617aa914751a42837fe262748b7f80eb2941`. It changes the isolated emulator test graph and its evidence gate. Firestore/Storage rules, runtime consent, revision handlers, prompt authority and production workflows are unchanged.

The previous rules workflow resolved dependencies with `npm install` and invoked a separate unscanned `npx firebase-tools@15.23.0`. Root/web audit evidence did not cover that CLI graph. The revised workflow uses a committed 724-entry npm lock and `npm ci --install-links --ignore-scripts`, audits every registry dependency of the exact installed CLI/test graph, and refuses audit errors, malformed metadata, hidden findings, nonzero severities or unsuccessful audit exit before executing the CLI. It retains the complete audit, installed graph, source/fork hashes, immutable source/run identity, consumer tests and emulator outcome as artifacts. Cleanup retains the tracked lock.

The graph pins Firebase CLI 15.24.0, Rules Unit Testing 5.0.1 and Firebase 12.13.0. It reuses the exact MIT braces 3.0.3-urai.1 and BSD-3-Clause stream-json 1.9.1-urai.1 source from Admin `6a1db34a98868ab7ea3356f87249522e0eadd4ad`, including original licenses and upstream file/tarball provenance. Compatible registry overrides retain Firebase's CommonJS CSV and transport APIs. Ordinary glob/JSON behavior and fixed depth boundaries are exercised through the actual installed Firebase CLI consumers.

## Executed local evidence

- A frozen isolated install completed: 722 installed packages, 724 committed lock entries.
- Node 22.23.3 ran 12 installed dependency/security cases and 11 audit rejection cases: 23 pass, zero fail or skipped.
- The installed CLI executed and reported 15.24.0.
- A full installed graph registry audit returned info/low/moderate/high/critical/total zero. The verifier returned `localSecurityForkAcceptance: false`.
- The workflow parsed successfully and retains its exact-head clean checkout, read-only permissions, behavioral Firestore/Storage matrix, always-uploaded receipts and final clean-source gate.
- An actual local emulator invocation exited before emulator startup: the available Java 17 runtime is unsupported; Firebase CLI requires Java 21 or newer. No local behavioral matrix pass is claimed. The native workflow already explicitly provisions Java 21.

Committed lock SHA-256: `cb6b31bb54153eef46be0be67432dbe287ce99399c8476cfebab43a5f7f12942`.

## Exact unresolved boundaries

**BLOCKED:** successor combined-head native workflow and the Firestore/Storage behavioral matrix have not completed. The owner’s current queued runs or predecessor passes do not approve this successor.

**BLOCKED:** independent security review of the local forks remains required. Registry scanners omit local package advisory matching; zero registry findings are not an upstream cure or an advisory waiver. The retained risks are GHSA-vfj7-8cjw-p6xm for braces and GHSA-mjw6-4jj6-33hc, GHSA-528h-pc64-c93x and GHSA-hqr4-qq8f-hg3x for stream-json. Each mitigation/reachability boundary is documented in the source SECURITY-FORK.md and tested. Original rights/provenance remain intact.

**BLOCKED:** Content’s independent exact-head prompt approval and protected production release gates still require their established legitimate human authority. This donor neither supplies nor bypasses approval, does not deploy, does not claim a Golden Master and does not transfer prior acceptance.
