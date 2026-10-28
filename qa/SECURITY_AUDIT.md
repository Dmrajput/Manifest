# Security Audit

## Positive controls

- Helmet, CORS configurable, rate limit on `/api/v1`  
- Bearer JWT required on private routes  
- Ownership checks on journal/goals/vision (`user_id` scoped)  
- Zod validation on mutating endpoints  
- Secrets intended in `backend/.env` (not `EXPO_PUBLIC_*`)  
- 500 responses hide internal messages

## Findings

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| SEC-001 | Medium | Supabase project migrated to ECC JWT signing; HS256 secret alone may fail — mitigated by `getUser` fallback | OPEN / mitigated |
| SEC-002 | High | No RevenueCat server verification — premium can be spoofed if client-only later | OPEN |
| SEC-003 | Medium | Vision `image_path` accepts any string/URL — SSRF/abuse risk if fetched server-side later | OPEN |
| SEC-004 | Low | AI prompt injection resistance not tested (coach not built) | OPEN |
| SEC-005 | Medium | Account deletion / GDPR export missing | OPEN |
| SEC-006 | Low | `CORS_ORIGIN=*` in local env | Acceptable for local |

## Secrets hygiene

- Do not commit `.env`  
- JWT secret was written locally during setup — rotate if repo ever leaked  
- Never log access tokens
