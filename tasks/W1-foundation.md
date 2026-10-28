# Week 1 — Project foundation

## Checklist

- [x] **W1-T1** Initialize monorepo (`mobile/`, `backend/`, `docs/`), git, root README, `.gitignore`, env examples
- [x] **W1-T2** Scaffold Expo app (blank JS template), Expo Router, core mobile dependencies
- [x] **W1-T3** Scaffold Express backend, health endpoint, response helpers, unit tests
- [x] **W1-T4** Mongoose models for all planned MongoDB collections (refs, indexes)
- [x] **W1-T5** Design tokens (`colors.js`) + PrimaryButton, AppHeader stubs
- [x] **W1-T6** Auth + tab route shells matching folder structure
- [x] **W1-T7** `api.js` + `supabase.js` client stubs with auth interceptor
- [x] **W1-T8** `docs/api.md`, `docs/database.md`, `docs/deployment.md` stubs

## Acceptance

- [x] `backend` health test passes
- [x] `mobile` package.json has no TypeScript toolchain as a primary language
- [x] Repo has clear README with setup steps
- [x] Mongoose model unit tests pass (`npm test` in `backend`)
- [x] Mobile design-token, API config, and route-shell tests pass
- [x] Git initialized at monorepo root (`d:\Manifest`)
- [x] Missing `expo-asset` / `expo-font` deps installed (Expo start unblocked)

## Notes

JavaScript only (`.js` / `.jsx`). No `.ts` / `.tsx` application source.

Database: **MongoDB + Mongoose** (not Prisma).
