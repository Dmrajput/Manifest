# Manifestly AI — Master Task List

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Weeks 1–5

See prior module files. Goals complete. Vision storage client upload + ownership checks done; bucket creation may still be needed in Supabase dashboard.

| ID | Task | Status |
| --- | --- | --- |
| W5-T1 | Goals + tasks API/screens | [x] |
| W5-T2 | Vision boards + Storage uploads | [x] (bucket config `[!]` if missing) |

## Week 6 — Reminders & polish

| ID | Task | Status | Module |
| --- | --- | --- | --- |
| W6-T1 | Reminders API + Expo local notifications | [x] | `tasks/W6-reminders.md` |
| W6-T2 | Working settings (profile/theme/lang/notifications) | [x] | `tasks/W6-reminders.md` |
| W6-T3 | Journal edit UI + account deletion | [x] | `tasks/W6-reminders.md` |
| W6-T4 | MVP regression tests | [x] | backend week6 suite |

## Phase 2

| ID | Task | Status |
| --- | --- | --- |
| P2-AI-001 | AI coach chat API + screen | [x] (mock mode without OPENAI_API_KEY) |
| P2-AI-002 | AI goal plan generation + save tasks | [x] |
| P2-MED-001 | Meditation library + expo-audio player | [x] (demo audio URLs) |
| P2-SUB-001 | Entitlement API + sandbox activate | [x] |
| P2-SUB-002 | RevenueCat + Google Play live billing | [!] needs store credentials |
| P2-AUTH-001 | Google OAuth scaffold | [!] needs Google provider credentials |
| P2-AUD-001 | Licensed production meditation catalog | [!] needs licensed assets |

## External blockers remaining

1. Create Supabase Storage bucket `vision-boards` (+ optional SERVICE_ROLE_KEY)
2. Google OAuth client in Supabase Auth
3. RevenueCat project + Play Console products
4. Production OpenAI key (mock works locally)
5. Licensed meditation audio assets
6. Android E2E (Maestro) device run
