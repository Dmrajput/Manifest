# Manifestly AI

Premium manifestation and self-improvement Android app.

- **Mobile:** React Native + Expo (JavaScript / JSX)
- **Backend:** Node.js + Express (JavaScript)
- **Database:** MongoDB + Mongoose
- **Auth:** Supabase Auth (JWT) with user profiles in MongoDB
- **AI:** OpenAI API (server-side only)

See `PROJECT_PLAN.md`, `TASKS.md`, and `PROGRESS.md` for status.

## Prerequisites

- Node.js **22.13+** (required by Expo SDK 58 / current Expo Go)
- Android Studio + SDK (for emulator / device)
- Git
- MongoDB (local or Atlas) — set `MONGODB_URI`
- Supabase project optional for Auth/Storage (URL + anon key; service role on backend only)
- OpenAI API key (backend only)

## Repository structure

```
mobile/     Expo Router app
backend/    Express API (/api/v1)
docs/       API, database, deployment notes
tasks/      Module task checklists
```

## Quick start — backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Health check: `GET http://localhost:5000/api/v1/health`

```bash
npm test
```

## Quick start — mobile

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Android emulator API base URL: `http://10.0.2.2:5000/api/v1`

Never put OpenAI, database, or Supabase **service role** keys in `EXPO_PUBLIC_*` variables.

## Language policy

JavaScript only. Do not add TypeScript application source (`.ts` / `.tsx`).
