INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "displayName",
  "role",
  "createdAt",
  "updatedAt"
)
VALUES (
  '7d0d4a7d-0bc8-4d13-a999-2da9b1b762de',
  'admin@gmail.com',
  '$2b$10$z94xV8RU7bkI/cIOXCl89e9OJq.trkwzHJYUvv0FeaBfL55rBRqLu',
  'NutriTrack Admin',
  'ADMIN',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email")
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "displayName" = EXCLUDED."displayName",
  "role" = 'ADMIN',
  "updatedAt" = CURRENT_TIMESTAMP;
