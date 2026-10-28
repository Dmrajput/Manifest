# Manifestly AI — Project Plan

Premium manifestation and self-improvement **Android** app.

| Layer | Technology |
| --- | --- |
| Mobile | React Native + Expo SDK 58 (JavaScript / JSX only) |
| Navigation | Expo Router |
| UI | NativeWind + custom styles |
| State | Zustand + Axios + TanStack Query |
| Backend | Node.js + Express.js (JavaScript only) |
| Database | MongoDB + Mongoose |
| Auth | Supabase Auth (JWT) + app user docs in MongoDB |
| AI | OpenAI API |
| Storage | Supabase Storage |
| Push | Expo Notifications + FCM |
| Payments | RevenueCat + Google Play Billing |
| Builds | Expo EAS Build |

**Hard rule:** No TypeScript anywhere in this repository.

## Phases

### MVP (Weeks 1–8)
Login, onboarding, dashboard, affirmations, journal, 369 method, goals, basic vision boards, reminders, AI-generated affirmations.

### Phase 2 (Weeks 9–11)
AI coach, personalized plans, guided audio, subscriptions, advanced analytics.

### Phase 3 (Week 12+)
AI vision boards, multilingual content, AI journal reflections, voice sessions, offline sync.

## Design tokens

| Token | Value |
| --- | --- |
| Background | `#F9F5FF` |
| Lavender | `#E9D5FF` |
| Primary | `#8B5CF6` |
| Text | `#221636` |
| Accent | `#F6C9BC` |

## Repository layout

```
manifestly-ai/
├── mobile/          # Expo React Native app
├── backend/         # Express + Mongoose (MongoDB) API
├── docs/            # API, database, deployment docs
├── tasks/           # Module task files
├── PROJECT_PLAN.md
├── TASKS.md
├── PROGRESS.md
└── README.md
```

## API

Base path: `/api/v1`

Success shape: `{ "success": true, "data": {}, "message": "..." }`  
Error shape: `{ "success": false, "error": { "code": "...", "message": "..." } }`

## Environments

- **local** — Android emulator `http://10.0.2.2:5000/api/v1`
- **staging / production** — HTTPS only; secrets never in `EXPO_PUBLIC_*`
