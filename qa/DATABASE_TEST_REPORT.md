# Database Test Report

**Engine:** MongoDB via Mongoose (not Prisma)  
**Test DB:** `mongodb-memory-server` (ephemeral)

## Models present

User, Affirmation, UserAffirmation, Goal (+ embedded tasks), JournalEntry, VisionBoard (+ embedded items), PracticeSession, AiConversation, MeditationAudio, Reminder, Subscription, AiUsage, UserActivity

## Verified

- User isolation on journal/goals/vision queries (`user_id` + auth subject)  
- Goal progress from weighted completed tasks  
- Vision free board count constraint (application-level)  
- Indexes declared on user_id / status fields in schemas  
- Cascade: deleting parent Goal/VisionBoard removes embedded subdocs with parent document

## Gaps

- No Prisma migrations (N/A)  
- Soft-delete not implemented  
- Orphan UserActivity rows retained after journal/goal delete  
- Subscription entitlement not wired to AI quota beyond local flags  
- Vision `image_path` accepts arbitrary URLs — no Storage ACL enforcement yet
