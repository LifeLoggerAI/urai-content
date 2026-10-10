# Content deployed-source identity boundary

The route smoke previously accepted HTTP 200 from every public route without
checking the service or source. Running the exact predecessor smoke against a
controlled HTTP server that reported another service and an older SHA returned
success for all 43 routes. That result could not prove the requested Content
artifact had been deployed.

The build now captures a complete Git SHA in the Next environment definitions.
Conflicting or truncated supplied identities stop the build; an unbound local
build reports an unknown identity. The version handler returns the captured
identity with no-store caching instead of substituting runtime Git variables.

Remote smoke requires the expected full SHA and checks the JSON service,
package, production runtime and source at `/api/version` without following a
redirect. It also proves that anonymous Admin and creator reads return their
401 authentication denial and that an unimplemented route returns 404. These
read-only probes preserve the existing public/protected route distinction.

The guarded Vercel workflow checks the actual prebuilt deployment URL, then the
configured public origin if different, against the same requested source.
It retains that smoke's stdout and stderr in the deployment evidence artifact,
including failed verification after a successful deploy command.
Production's short-lived runtime identity gate and deployment credentials,
governance, provider and independent review requirements remain in force.

Supplemental verification on the changed source passes all 259 web tests:
232 retained tests in 26 files and 27 added tests in two files. Scoped lint and
strict changed-path types also pass. Six actual smoke executions over
controlled HTTP fixtures accept matching identity/boundaries and reject stale,
missing or unrelated identity, open private reads and wildcard 200 responses.
The loaded cached graph used Next 15.5.27, React 19.2.4, TypeScript 6.0.3,
Vitest 4.1.11 and Vite 8.3.3. It differs from the committed frozen graph.

Full TypeScript 6 verification encounters the existing CSS side-effect import
compatibility error. A broader cached Next compiler probe also lacks a Terser
plugin module. Both limitations are retained as failures; fresh frozen native
install, complete build/browser/emulator checks, actual protected provider
lifecycle, deployed source parity and independent acceptance are still required.

The historical Vercel double-path build error needs the existing team's actual
root directory, build command and output-directory readback. Current access
does not expose those settings or build logs, so this source repair does not
establish a correction of that historical project configuration.
