# Firebase Adapter Implementation Guide

`urai-content` intentionally ships a repository contract, not a live Firebase Admin adapter. This keeps the package safe to import in multiple URAI runtimes without forcing credentials, Admin SDK initialization, or hosting decisions into the content package.

## Goal

A consuming backend, Firebase Functions app, or future standalone web runtime should implement the current `ContentRepository` contract from `src/backend/types.ts` using Firestore and inject it into `ContentService`.

Do not copy an adapter whose method names differ from the current interface. The source of truth is always `src/backend/types.ts`.

## Required runtime responsibilities

The runtime app must own:

- Firebase Admin SDK initialization
- Auth custom claims and role checks
- Firestore reads/writes
- Storage writes for exports
- Stripe verification and checkout webhooks
- deployment secrets
- emulator setup
- production environment separation

## Recommended file layout in consuming app

```txt
src/
  firebase/
    admin.ts
    contentRepository.ts
  functions/
    content.ts
    exports.ts
    marketplace.ts
    webhooks.ts