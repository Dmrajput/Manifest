# Manifestly AI — API

Base path: `/api/v1`

## Response shapes

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

## Implemented

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | Liveness check; returns `x-request-id` |
| GET | `/users/me` | Auth required — get or create MongoDB profile from Supabase JWT |
| PATCH | `/users/me` | Auth required — update name, timezone, preferences, onboarding flag |
| GET | `/dashboard` | Auth required — home payload (affirmation, rituals, streak, quota) |
| GET | `/affirmations` | Auth required — library (+ `favoritesOnly=true`) |
| POST | `/affirmations/favorites` | Auth required — `{ affirmation_id, is_favorite }` |
| POST | `/ai/affirmations` | Auth required — generate affirmations (daily quota) |
| GET | `/journal` | Auth required — list journal entries |
| POST | `/journal` | Auth required — create entry |
| PATCH | `/journal/:id` | Auth required — update owned entry |
| DELETE | `/journal/:id` | Auth required — delete owned entry |
| GET | `/practice/369/today` | Auth required — morning/afternoon/evening progress |
| POST | `/practice/369` | Auth required — `{ period, count, content? }` |
| GET | `/progress` | Auth required — streak in user timezone |

Send `Authorization: Bearer <supabase_access_token>`.

AI free quota: 3/day. Premium: 20/day. Set `AI_AFFIRMATIONS_MOCK=1` to use local fallback without OpenAI.

369 targets: morning 3 · afternoon 6 · evening 9. Streaks use the user's `timezone` field.
