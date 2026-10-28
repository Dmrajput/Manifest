# Regression Test Report

**Date:** 2026-10-28

| Suite | Command | Result |
| --- | --- | --- |
| Backend | `npm test --prefix backend` | **34/34 PASS** |
| Mobile | `npm test --prefix mobile` | **15/15 PASS** |
| Week 5 focused | `node --test tests/week5.goals-vision.test.js` | **4/4 PASS** |
| Android E2E (Maestro/Detox) | — | **BLOCKED** (not configured / not run) |
| Expo Android bundle | Deep Ionicons import | Expected fixed; device reload required |

## After fixes

- Goals IDOR + vision free-limit regressions locked in week5 tests  
- Existing week3/week4 suites still green with dashboard → goalService progress helper move
