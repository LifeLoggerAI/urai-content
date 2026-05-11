// Vitest runs outside the Next.js server runtime. The real `server-only`
// package intentionally throws when imported in that environment, so tests
// alias it to this noop module while production builds keep the real guard.
export {};
