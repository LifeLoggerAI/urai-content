# Firebase Setup

This repo currently provides backend domain logic and validation. To wire to live Firebase:
1. Add service account env vars from `.env.example`.
2. Add Firestore adapters around `ContentService` methods.
3. Enforce same schema validations on API/function boundaries.
