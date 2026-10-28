# Week 3 — Dashboard & affirmations

## Checklist

- [x] **W3-T1** `GET /dashboard` + Home screen
- [x] **W3-T2** Affirmations list, favorites, Affirmations screen
- [x] **W3-T3** `POST /ai/affirmations` with quota + usage logging

## Depends on

Week 2 auth complete

## Verification

- Backend Week 3 suite covers dashboard, library seed, favorites, AI generate + quota (429)
- Mobile Home uses TanStack Query → `/dashboard`
- Affirmations screen: browse, save, next, Generate with AI
- Fallback generator when `AI_AFFIRMATIONS_MOCK=1` or no OpenAI key
