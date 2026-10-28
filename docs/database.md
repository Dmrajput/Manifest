# Manifestly AI — Database

**MongoDB** via Mongoose (JavaScript). No Prisma / PostgreSQL.

Connection: `MONGODB_URI` in `backend/.env`

Models: `backend/src/models/`

## Collections

| Collection | Model | Notes |
| --- | --- | --- |
| `users` | User | Profile + embedded preferences |
| `affirmations` | Affirmation | Library / AI-sourced lines |
| `user_affirmations` | UserAffirmation | Favorites join |
| `goals` | Goal | Embedded `tasks[]` |
| `journal_entries` | JournalEntry | Private per user |
| `vision_boards` | VisionBoard | Embedded `items[]` |
| `practice_sessions` | PracticeSession | 369 morning/afternoon/evening |
| `ai_conversations` | AiConversation | Embedded `messages[]` |
| `meditation_audio` | MeditationAudio | Catalog |
| `reminders` | Reminder | Local reminder schedule |
| `subscriptions` | Subscription | RevenueCat sync |
| `ai_usage` | AiUsage | Quota / cost tracking |
| `user_activity` | UserActivity | Streak inputs |

## Rules

- MongoDB `ObjectId` primary keys
- UTC timestamps (`created_at` / `updated_at`)
- Ownership enforced in API layer (`user_id` filters)
- Private journal and vision media never publicly readable
- Streaks calculated in the **user timezone**
- Indexes on user-owned query paths
