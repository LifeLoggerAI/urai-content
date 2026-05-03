# Testing

## Local quality gate
Run:
- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run validate:content`
- `npm run validate:sprites`
- `npm run content:index`
- `git diff --exit-code`
- `npm test`
- `npm run build`
- `npm run check`

If registry access is blocked, run what is possible and rely on CI runner with npm registry access.
