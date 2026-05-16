# Web Runtime Validation

The repository has two validation surfaces:

1. Root package validation for the existing `urai-content` package.
2. Web runtime validation for `apps/web`.

## Important checkout note

If `npm run typecheck` prints unexpected scripts, your local checkout may not be on the same branch as the current implementation stack. Update your branch or inspect `package.json` before validating.

```bash
git status
git branch --show-current
cat package.json
npm run
```

## Root package validation

Run from the repository root:

```bash
npm ci
npm run lint
npm run typecheck
npm run validate:content
npm run validate:sprites
npm run content:index
git diff --exit-code
npm test
npm run build
npm run seed:check
npm run seed:system:check
npm run check
```

## Web runtime validation from root

Run from the repository root after the web runtime branch is checked out:

```bash
npm run web:install
npm run web:typecheck
npm run web:test
npm run web:build
npm run web:check
```

## Managed smoke route validation

`npm run web:smoke:routes` verifies public pages, metadata routes, and API health/catalog routes over HTTP.

The smoke script now behaves as follows:

- If `WEB_SMOKE_BASE_URL` is set, it checks that already-running server and does not start one.
- If `WEB_SMOKE_BASE_URL` is not set, it probes `http://127.0.0.1:3000`.
- If no server is listening, it starts `npm run start -- --hostname 127.0.0.1 --port 3000` inside `apps/web`.
- It requires a successful `npm run web:build` first because `next start` serves the production build.

Recommended root sequence:

```bash
npm run web:build
npm run web:smoke:routes
```

To smoke test a deployed preview instead:

```bash
WEB_SMOKE_BASE_URL=https://your-preview-url.example npm run web:smoke:routes
```

To require a manually started local server:

```bash
WEB_SMOKE_MANAGE_SERVER=false npm run web:smoke:routes
```

## Web runtime validation from `apps/web`

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run build
npm run check
npm run smoke:routes
```

## Full validation after the stack lands

```bash
npm ci
npm run check
npm run web:install
npm run web:check
npm run web:build
npm run web:smoke:routes
```

## Audit posture

The current audit finding is a moderate `esbuild` development-server advisory flowing through `vite` and `vitest`. The reported forced remediation upgrades Vitest to a new major version, which is a breaking change and should not be applied blindly.

Recommended handling:

1. Treat the current finding as a development-tooling risk, not a production runtime route blocker.
2. Do not expose Vite/Vitest dev servers to untrusted networks.
3. Track a planned test-stack upgrade separately.
4. Only run `npm audit fix --force` after confirming Vitest 4.x compatibility across root and `apps/web` tests.

## Current launch caveats

- Firebase credentials, Firestore rules deployment, DNS, hosting, and production launch still require environment-specific deployment evidence.
- Public forms degrade safely in preview mode when Firebase Admin credentials are absent.
- Data ownership copy must remain opt-in and must not imply guaranteed earnings.
- URAI mental health copy must remain reflective and non-diagnostic.
