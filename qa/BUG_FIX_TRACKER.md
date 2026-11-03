# Bug Fix Tracker

## Fixed this wave (functional testing 2026-10-31)

| ID | Issue | Linked tests | Status |
| --- | --- | --- | --- |
| BUG-UI-KEYBOARD-001 | Android keyboard overlaps focused inputs / action buttons (AI Coach + forms) | KB-001…016 | **FIXED** — `softwareKeyboardLayoutMode: resize`; reusable `KeyboardAware` + `useKeyboardBottomInset` (skips pad when adjustResize already shrunk window); `Screen` iOS KAV + Android inset + scroll keyboard props; AI Coach sticky row composer; Journal create/edit keyboard-aware. Native `app.json` change needs a **dev-client/APK rebuild** to apply outside Expo Go. Device visual KB-* checks remain **manual**. |
| NEW | Specific-time reminder notifications (Settings hard-coded 8/12/21) | NOT-001/004 | **FIXED** — Settings time pickers + API hour/minute + local daily schedule |
| BUG-FT-001 | Invalid MongoDB ObjectId → unhandled CastError / HTTP 500 | DB-003, API-003 | **FIXED** — `backend/src/middleware/errorHandler.js` returns 400 `VALIDATION_ERROR`; regression in `backend/tests/functional.suite.test.js` |
| BUG-008 | Vision signed/client upload + ownership | VIS ownership | FIXED (bucket provisioning may still be needed) |
| BUG-010 | Notifications missing | NOT-* | FIXED (local Expo scheduling) |
| BUG-011 | AI Coach placeholder | AI-* | FIXED (API + UI + tests) |
| BUG-012 | Meditation no playback | MED-* | FIXED (expo-audio + library) |
| BUG-013 | Journal edit UI | JRN-004 | FIXED |
| BUG-015 | Settings inert | SET-001 | FIXED |
| NEW | Account deletion | SET-005 | FIXED + tested |
| NEW | AI goal plans | GOAL-009/011 | FIXED + tested |

## Confirmed missing (not product defects of existing code paths)

| ID | Issue | Linked tests | Status |
| --- | --- | --- | --- |
| BUG-FT-002 | GDPR / user data export | SET-004 | **MISSING** — no API or Settings UI |
| BUG-FT-003 | Billing webhook idempotency | SUB-007 | **MISSING** — blocked on RevenueCat integration |

| NEW | Vision board collage card previews + list selection/upload | VIS-CARD-* | **FIXED** — `VisionBoardCollage.jsx`; `getBoardPreviewImageUris`; list screen selection border + footer upload |

## Still open / blocked

| ID | Issue | Status |
| --- | --- | --- |
| BUG-009 | Live RevenueCat / Play Billing | BLOCKED |
| GOOGLE | Live Google OAuth | BLOCKED |
| AUDIO | Licensed meditation catalog | BLOCKED |
| E2E | Android device E2E (Maestro) | **UNBLOCKED** — Maestro 2.12.0 + SM_S928B; AND-001…013 PASS (Expo Go); AND-014 still NOT_RUN |
| SEC-005 | Account deletion done; export still open | PARTIAL (delete FIXED; export = BUG-FT-002) |

## Production readiness audit (2026-11-03)

| ID | Issue | Status |
| --- | --- | --- |
| PROD-AI-001 | Production API returned mock/fallback AI when Gemini failed or unconfigured | **FIXED** — `backend/src/utils/aiMode.js`; coach + affirmations |
| PROD-AI-002 | Production could start with `AI_*_MOCK=1` | **FIXED** — `server.js` exit on boot |
| PROD-UI-001 | Profile showed “Premium Member” for all users | **FIXED** — entitlement query on `profile.jsx` |
| PROD-BUILD-001 | Missing `eas.json` / `versionCode` | **FIXED** — added |
| PROD-TEST-001 | Live R2 test ran without env and failed suite noise | **FIXED** — `describe.skip` unless `RUN_VISION_UPLOAD_INTEGRATION=1` |
| PROD-HOME-001 | Notification icon opened Settings | **FIXED** (prior) — `/notifications` |

## Regression evidence (2026-11-03)

- Backend: **82/82** tests pass (`npm test --prefix backend`).
- Mobile: **43/43** tests pass (`npm test --prefix mobile`).
- Render health: `GET https://manifestly-api.onrender.com/api/v1/health` → 200 (audit).
- MongoDB Atlas: connected on Render (log: “Connected to MongoDB”).

## Still open / blocked
