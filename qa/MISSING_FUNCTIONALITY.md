# Missing / Incomplete Functionality

Classification key: `IMPLEMENTED_AND_VERIFIED` · `IMPLEMENTED_BUT_BROKEN` · `PARTIALLY_IMPLEMENTED` · `NOT_IMPLEMENTED` · `BLOCKED_BY_EXTERNAL_SERVICE` · `NOT_APPLICABLE`

## Authentication & Onboarding

| Requirement | Classification | Evidence |
| --- | --- | --- |
| Splash / session bootstrap | IMPLEMENTED_AND_VERIFIED | `AuthProvider`, `useAuthBootstrap` |
| Onboarding slides + interests | IMPLEMENTED_AND_VERIFIED | `(auth)/onboarding`, `interests` |
| Google login | NOT_IMPLEMENTED | Removed misleading buttons; note on login screen |
| Email signup/login | IMPLEMENTED_AND_VERIFIED | Supabase Auth |
| Password reset | PARTIALLY_IMPLEMENTED | Mobile calls reset; deep-link recovery UI not built |
| Logout | IMPLEMENTED_AND_VERIFIED | Profile Sign Out |
| Protected routes | PARTIALLY_IMPLEMENTED | Auth gate exists; some shells reachable when logged in |
| Profile creation in Mongo | IMPLEMENTED_AND_VERIFIED | `getOrCreateFromAuth` |

## Core MVP modules

| Requirement | Classification | Notes |
| --- | --- | --- |
| Home dashboard | IMPLEMENTED_AND_VERIFIED | Live API |
| Affirmations favorites + AI quota | IMPLEMENTED_AND_VERIFIED | |
| Affirmation share image | NOT_IMPLEMENTED | Text share only |
| Journal create/list/delete | IMPLEMENTED_AND_VERIFIED | Long-press delete |
| Journal edit UI | NOT_IMPLEMENTED | API exists |
| 369 + streak TZ | IMPLEMENTED_AND_VERIFIED | |
| Goals CRUD + tasks | IMPLEMENTED_AND_VERIFIED | Added Week 5 |
| AI action plans | NOT_IMPLEMENTED | |
| Vision create/list/delete/items | PARTIALLY_IMPLEMENTED | Remote URL items; no camera/gallery upload |
| Signed Storage URLs | NOT_IMPLEMENTED | |
| Vision reorder UI | NOT_IMPLEMENTED | API exists |
| Reminders / Expo Notifications | NOT_IMPLEMENTED | Model only |
| Settings prefs persistence | PARTIALLY_IMPLEMENTED | Backend PATCH; Settings UI inert |

## Phase 2

| Requirement | Classification |
| --- | --- |
| AI Coach chat | NOT_IMPLEMENTED |
| Meditation playback | NOT_IMPLEMENTED |
| RevenueCat / Play Billing | NOT_IMPLEMENTED |
| Advanced analytics charts | NOT_IMPLEMENTED (decorative UI) |
| Account deletion / data export | NOT_IMPLEMENTED |

## Stack mismatch vs user prompt

| Claimed | Actual | Impact |
| --- | --- | --- |
| PostgreSQL + Prisma | MongoDB + Mongoose | All DB audit uses Mongoose |
| App “complete” | Weeks 1–5 partial | Production readiness NOT_READY |
