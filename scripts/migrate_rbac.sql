-- =============================================
-- FL360Miles RBAC Migration Script
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'developer' CHECK (role IN ('owner', 'developer', 'demo')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- 2. Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM user_profiles
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        CASE
            -- First user is automatically owner
            WHEN (SELECT COUNT(*) FROM user_profiles) = 0 THEN 'owner'
            -- Check if it's the demo account
            WHEN NEW.email = 'demo@fl360miles.com' THEN 'demo'
            -- Otherwise default to developer
            ELSE 'developer'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owner can view all profiles" ON user_profiles
    FOR SELECT USING (get_user_role() = 'owner');

CREATE POLICY "Owner can manage profiles" ON user_profiles
    FOR ALL USING (get_user_role() = 'owner');

-- 5. Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- IMPORTANT: After running this script:
-- 
-- 1. Create a demo account in Supabase Auth:
--    Email: demo@fl360miles.com
--    Password: demo360
--
-- 2. If your owner account already exists, 
--    manually insert your profile:
--    
--    INSERT INTO user_profiles (user_id, email, role)
--    SELECT id, email, 'owner'
--    FROM auth.users
--    WHERE email = 'YOUR_EMAIL_HERE';
--
-- =============================================
