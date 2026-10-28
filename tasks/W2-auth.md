# Week 2 — Auth & onboarding

## Checklist

- [x] **W2-T1** Supabase Auth email flow + SecureStore session
- [x] **W2-T2** Welcome, Login, Signup screens wired
- [x] **W2-T3** Onboarding slides + interests → preferences
- [x] **W2-T4** Backend auth middleware (Supabase JWT)
- [x] **W2-T5** `GET/PATCH /users/me` + preferences

## Depends on

W1-T1 … W1-T8 complete

## Verification

- Backend: auth middleware + `/users/me` integration tests (MongoMemoryServer)
- Mobile: onboarding content, auth module, route shell tests
- Requires `EXPO_PUBLIC_SUPABASE_*` on mobile and `SUPABASE_JWT_SECRET` + `MONGODB_URI` on backend for live use
