# Testing

## Local quality gate

Run the full quality gate in this order:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm run content:check`
9. `npm test`
10. `npm run build`
11. `npm run seed:check`
12. `npm run check`

## Notes

- `git diff --exit-code` should run immediately after `npm run content:index` to ensure generated index changes are committed.
- `npm run content:check` validates package content consistency before tests/build.
- `npm run seed:check` validates demo seed packs before the final package check.
- If registry access is blocked, run what is possible locally and rely on a CI runner with npm registry access for the full suite.