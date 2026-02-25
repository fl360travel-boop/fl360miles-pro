-- =============================================
-- MIGRATION: billing_status table
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Create the billing_status table
CREATE TABLE IF NOT EXISTS billing_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_paid_at TIMESTAMPTZ NULL,
    due_date DATE NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DUE_SOON', 'DUE_TODAY', 'OVERDUE_WARNING', 'BLOCKED')),
    popup_last_shown_at DATE NULL,
    popup_snoozed_until TIMESTAMPTZ NULL,
    blocked_at TIMESTAMPTZ NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Auto-update updated_at
CREATE TRIGGER update_billing_status_updated_at
    BEFORE UPDATE ON billing_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable RLS
ALTER TABLE billing_status ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — each user can only access their own row
CREATE POLICY "Users can view their own billing_status"
    ON billing_status FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing_status"
    ON billing_status FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing_status"
    ON billing_status FOR UPDATE
    USING (auth.uid() = user_id);

-- 5. Service role policy (for webhooks / Netlify functions using service key)
CREATE POLICY "Service role full access on billing_status"
    ON billing_status FOR ALL
    USING (auth.role() = 'service_role');

-- 6. Auto-create billing_status row when a new user signs up
-- This trigger fires AFTER a new user is inserted in auth.users
CREATE OR REPLACE FUNCTION handle_new_user_billing()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.billing_status (user_id, status, created_at)
    VALUES (NEW.id, 'ACTIVE', NOW())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created_billing ON auth.users;
CREATE TRIGGER on_auth_user_created_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_billing();

-- 7. Create billing_status for all existing users that don't have one yet
INSERT INTO billing_status (user_id, status, created_at)
SELECT id, 'ACTIVE', NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM billing_status)
ON CONFLICT (user_id) DO NOTHING;

-- 8. Index for performance
CREATE INDEX IF NOT EXISTS idx_billing_status_due_date ON billing_status(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_status_status ON billing_status(status);
