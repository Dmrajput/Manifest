# Manifestly AI — Deployment

| Component | Target |
| --- | --- |
| Android app | Google Play via Expo EAS Build |
| API | Render / Railway / AWS |
| Database | MongoDB Atlas |
| Media | Supabase Storage or S3 (signed URLs) |
| AI | OpenAI API |
| Push | Expo Notifications + FCM |
| Monitoring | Sentry / Crashlytics |
| CI | GitHub Actions + EAS |

## Local

- Backend binds `0.0.0.0:$PORT` (Render-compatible)
- MongoDB: local `mongodb://127.0.0.1:27017/manifestly` or Atlas URI
- Android emulator → host API: `http://10.0.2.2:5000/api/v1`

## Secrets

Never put MongoDB, OpenAI, or service-role keys in `EXPO_PUBLIC_*`.
