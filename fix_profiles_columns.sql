-- Fix profiles table missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- If for some reason the table is named 'profiller' or there's a localized terminology issue:
-- Note: 'profiller' table isn't found in code, but if it exists in DB, we should sync it.
-- ALTER TABLE profiller ADD COLUMN IF NOT EXISTS "e-posta" TEXT;
