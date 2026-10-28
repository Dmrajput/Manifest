# Manifestly AI — QA Master Checklist

**Stack under test (actual):** React Native Expo 58 · Express · **MongoDB + Mongoose** · Supabase Auth · OpenAI  
**Note:** Prompt claimed Postgres/Prisma — **not used**. Audit follows real codebase.

**Last updated:** 2026-10-28  
**App completeness claim:** “development complete” — **FALSE**. Weeks 1–5 (partial vision uploads) only.

| Module | Status | Notes |
| --- | --- | --- |
| Auth email login/signup | IMPLEMENTED_AND_VERIFIED (API/unit) | Confirm-email disabled for local; Google/Phone not implemented |
| Password reset | IMPLEMENTED_AND_VERIFIED (code path) | Uses Supabase `resetPasswordForEmail`; email delivery rate-limited on free SMTP |
| Onboarding / interests | IMPLEMENTED_AND_VERIFIED | Wired to `/users/me` |
| Dashboard | IMPLEMENTED_AND_VERIFIED | Rituals/streak/quota |
| Affirmations + AI gen | IMPLEMENTED_AND_VERIFIED | Share text added; image share not done |
| Journal CRUD | PARTIALLY_IMPLEMENTED | API full; UI create/list/delete; edit UI missing |
| 369 practice | IMPLEMENTED_AND_VERIFIED | Morning/afternoon/evening targets |
| Goals + tasks | IMPLEMENTED_AND_VERIFIED | Added 2026-10-28 + tests |
| Vision boards | PARTIALLY_IMPLEMENTED | CRUD + items + free limit; no signed Storage upload / reorder UI |
| AI Coach | NOT_IMPLEMENTED | UI shell only |
| Meditation audio | NOT_IMPLEMENTED | UI shell; no playback |
| Progress analytics | PARTIALLY_IMPLEMENTED | Streak + counts; charts are decorative |
| Notifications | NOT_IMPLEMENTED | |
| Premium / RevenueCat | NOT_IMPLEMENTED | UI shell; no purchase verification |
| Profile settings | PARTIALLY_IMPLEMENTED | Menu + logout; prefs not editable end-to-end |
| Android E2E | BLOCKED | No Maestro/Detox run this session |

## Priority queue

1. P0 security/auth — JWT secret set; IDOR checks on journal/goals/vision ✅  
2. P1 Week 5 goals/vision — goals ✅ vision partial ✅  
3. P1 fake social login buttons — removed ✅  
4. P2 journal edit UI, vision uploads, reminders  
5. P3 premium/coach/meditation Phase 2
