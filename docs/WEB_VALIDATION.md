# Web Runtime Validation

The repository now has two validation surfaces:

1. Root package validation for the existing `urai-content` package.
2. Web runtime validation for `apps/web`.

## Important checkout note

If `npm run typecheck` prints `pnpm -r typecheck`, your local checkout is not on the same branch as the current implementation stack. Update your branch or inspect `package.json` before validating.

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
npm run check
npm run done
```

## Web runtime validation from root

Run from the repository root after the web runtime PRs are checked out:

```bash
npm run web:install
npm run web:typecheck
npm run web:test
npm run web:build
npm run web:check
```

## Web runtime validation from `apps/web`

```bash
cd apps/web
npm install
npm run typecheck
npm test
npm run build
npm run check
```

## Full validation after the stack lands

```bash
npm ci
npm run check
npm run web:install
npm run web:check
```

## Current caveats

- `npm audit` may report framework/package vulnerabilities. Address those separately from compile/test failures.
- The web runtime is still staged. Firebase credentials, Firestore rules deployment, Stripe, DNS, and production launch are not complete until dedicated deployment evidence exists.
- Do not use `npm audit fix --force` blindly; it can introduce breaking dependency changes.
