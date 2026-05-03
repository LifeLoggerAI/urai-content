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
- `npm run content:check`
- `npm test`
- `npm run build`
- `npm run seed:check`
- `npm run check`

## Notes

- `git diff --exit-code` should run after `npm run content:index` to ensure generated index changes are committed.
- If registry access is blocked, run what is possible locally and rely on a CI runner with npm registry access for the full suite.