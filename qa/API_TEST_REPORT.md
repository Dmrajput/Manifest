# API Test Report

**Base:** `/api/v1`  
**Runner:** Node test runner + Supertest + MongoMemoryServer  
**Result (2026-10-28):** **34/34 pass**

## Inventory (implemented)

| Method | Path | Auth | Automated coverage |
| --- | --- | --- | --- |
| GET | `/health` | No | Yes |
| GET/PATCH | `/users/me` | Yes | Yes |
| GET | `/dashboard` | Yes | Yes (week3) |
| GET | `/affirmations` | Yes | Yes |
| POST | `/affirmations/favorites` | Yes | Yes |
| POST | `/ai/affirmations` | Yes | Yes (mock) |
| GET/POST/PATCH/DELETE | `/journal` | Yes | Yes |
| GET/POST | `/practice/369*` | Yes | Yes |
| GET | `/progress` | Yes | Yes |
| CRUD | `/goals` + tasks | Yes | Yes (week5) |
| CRUD | `/vision-boards` + items | Yes | Yes (week5) |

## Checks executed

- Unauthorized → 401 on goals  
- Goal create → task complete → progress 50%  
- Cross-user goal GET → 404 (IDOR)  
- Vision free limit 4th board → 403 `PREMIUM_REQUIRED`  
- Journal CRUD (week4)  
- 369 period targets (week4)

## Not covered / missing routes

| Area | Status |
| --- | --- |
| Storage signed URL endpoints | Missing |
| RevenueCat webhook / entitlements | Missing |
| AI coach conversations | Missing |
| Reminders CRUD | Missing |
| Account delete | Missing |
