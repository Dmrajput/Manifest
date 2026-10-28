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
| GET | `/goals` | Auth required — list goals (`?status=active\|completed\|archived\|all`) |
| POST | `/goals` | Auth required — create goal (+ optional tasks) |
| GET | `/goals/:id` | Auth required — get owned goal |
| PATCH | `/goals/:id` | Auth required — update owned goal |
| DELETE | `/goals/:id` | Auth required — delete owned goal |
| POST | `/goals/:id/tasks` | Auth required — add task |
| PATCH | `/goals/:id/tasks/:taskId` | Auth required — update/complete task |
| DELETE | `/goals/:id/tasks/:taskId` | Auth required — delete task |
| GET | `/vision-boards` | Auth required — list boards |
| POST | `/vision-boards` | Auth required — create board (free limit 3) |
| GET | `/vision-boards/:id` | Auth required — get owned board |
| PATCH | `/vision-boards/:id` | Auth required — update board |
| DELETE | `/vision-boards/:id` | Auth required — delete board |
| POST | `/vision-boards/:id/items` | Auth required — add image item (`image_path`) |
| PATCH | `/vision-boards/:id/items/:itemId` | Auth required — update item |
| DELETE | `/vision-boards/:id/items/:itemId` | Auth required — delete item |
| POST | `/vision-boards/:id/items/reorder` | Auth required — `{ ordered_item_ids }` |

Send `Authorization: Bearer <supabase_access_token>`.

AI free quota: 3/day. Premium: 20/day. Set `AI_AFFIRMATIONS_MOCK=1` to use local fallback without OpenAI.

369 targets: morning 3 · afternoon 6 · evening 9. Streaks use the user's `timezone` field.
