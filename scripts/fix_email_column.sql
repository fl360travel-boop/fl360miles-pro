-- Add email column to user_profiles if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Update existing profiles with emails from auth.users
UPDATE user_profiles
SET email = u.email
FROM auth.users u
WHERE user_profiles.user_id = u.id
AND (user_profiles.email IS NULL OR user_profiles.email = '');
