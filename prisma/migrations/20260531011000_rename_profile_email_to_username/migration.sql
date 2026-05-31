ALTER TABLE "Profile" RENAME COLUMN "email" TO "username";
ALTER INDEX IF EXISTS "Profile_email_key" RENAME TO "Profile_username_key";
