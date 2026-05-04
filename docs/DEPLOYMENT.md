# Deployment

## Canonical command order

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run validate:content`
5. `npm run validate:sprites`
6. `npm run content:index`
7. `git diff --exit-code`
8. `npm test`
9. `npm run build`
10. `npm run seed:check`
11. `npm run check`

## Deploy

Deploy compiled output `dist` alongside the Firebase/API host integration.