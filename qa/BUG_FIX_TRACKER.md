# Bug Fix Tracker

## BUG-001 — Fake social login buttons
- **Severity:** High  
- **Expected:** Only working auth methods shown  
- **Actual:** Google/Phone buttons did nothing  
- **Root cause:** UI added for design parity without OAuth wiring  
- **Files:** `mobile/app/(auth)/login.jsx`  
- **Fix:** Removed dead social buttons; email + forgot password only; note for later Google/Phone  
- **Retest:** Code review + manual path present  
- **Status:** VERIFIED (code)

## BUG-002 — Vector icons Zocial resolve failure
- **Severity:** Critical (app would not bundle)  
- **Files:** All Ionicons imports  
- **Fix:** Deep import `@expo/vector-icons/Ionicons`  
- **Status:** VERIFIED (bundle previously failed; import path corrected)

## BUG-003 — Goals & vision boards missing
- **Severity:** High  
- **Expected:** Week 5 CRUD per PROJECT_PLAN  
- **Actual:** Mongoose models only; UI static  
- **Files:** `backend/src/services/goalService.js`, `visionService.js`, routes/controllers, mobile goals/vision screens, `tests/week5.goals-vision.test.js`  
- **Fix:** Full goals API + vision boards API (items, free limit 3, IDOR isolation) + mobile wiring  
- **Retest:** `npm test --prefix backend` → Week 5 suite 4/4 pass; full backend 34/34  
- **Status:** VERIFIED

## BUG-004 — Journal delete unused
- **Severity:** Medium  
- **Fix:** Long-press delete with confirm → `DELETE /journal/:id`  
- **Status:** FIXED (manual device retest recommended)

## BUG-005 — Affirmation share
- **Severity:** Medium  
- **Fix:** `Share.share` wired on AffirmationCard  
- **Status:** FIXED

## BUG-006 — Password reset
- **Severity:** Medium  
- **Fix:** `resetPassword` + Forgot password button  
- **Status:** FIXED (email delivery depends on Supabase SMTP quota)

## Remaining OPEN
See BUG-008–BUG-015 in `BUG_REPORT.md`.
