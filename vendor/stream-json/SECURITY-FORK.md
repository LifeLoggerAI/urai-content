# Local stream-json security fork

This is a local fork of the BSD-3-Clause `stream-json@1.9.1` npm distribution, identified as `1.9.1-urai.1`. The original license and README are retained. `UPSTREAM-PROVENANCE.json` records the tarball SHA-256 and every original file hash. This is not an upstream patched release.

Firebase CLI 15.24.0 uses the CommonJS 1.x parser and streamer paths. Upstream patched 3.6.0 has an ESM interface and changed subpaths. An untested major override would break the required emulator tooling.

The local changes retain the 1.x API and add these explicit mitigations:

- GHSA-mjw6-4jj6-33hc: Assembler writes object keys with `Object.defineProperty`, including the reviver path. `__proto__` remains an enumerable own data property, as it does in `JSON.parse`, without changing the assembled object's prototype.
- GHSA-528h-pc64-c93x: Parser, Verifier, Assembler and every FilterBase write reject nesting beyond 128. The filter bound runs before all dynamically selected pass/skip handlers, including direct caller-supplied token input. This bounds path joining as a function of depth and rejects excessive nesting explicitly.
- GHSA-hqr4-qq8f-hg3x: the installed 1.x Parser/Verifier do not implement JSONC comments. Regression tests stream a comment one character at a time and prove rejection. This is a reachability finding for the pinned 1.x implementation, not an implementation of the 3.x comment-parser fix.

`scripts/dependency-security.behavior.test.cjs` resolves the actual Firebase CLI consumers and exercises these cases, ordinary parsing, the depth boundary, all four filters and CLI transport compatibility. The source fork requires independent security review; a zero registry advisory count is not that review. Local file dependencies may be omitted by registry scanners, so these GHSAs remain explicitly recorded until a compatible upstream fixed release replaces this fork and exact-head checks are rerun.

Sources:

- https://registry.npmjs.org/stream-json/1.9.1
- https://github.com/uhop/stream-json/security/advisories/GHSA-mjw6-4jj6-33hc
- https://github.com/uhop/stream-json/security/advisories/GHSA-528h-pc64-c93x
- https://github.com/uhop/stream-json/security/advisories/GHSA-hqr4-qq8f-hg3x
