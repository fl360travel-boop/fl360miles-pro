-- =============================================
-- MIGRATION: Auto-Provisioning tables
-- payment_events (idempotency) + audit_events (logging)
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Payment Events (idempotency table)
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_payment_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    status TEXT NOT NULL,
    plan TEXT,
    payload_json JSONB,
    processed_at TIMESTAMPTZ,
    provisioned_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_email ON payment_events(email);
CREATE INDEX IF NOT EXISTS idx_payment_events_external_id ON payment_events(external_payment_id);

-- 2. Audit Events (logging table)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN (
        'USER_CREATED',
        'TEMP_PASSWORD_CREATED',
        'EMAIL_SENT',
        'PASSWORD_CHANGED',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'PAYMENT_WEBHOOK_RECEIVED',
        'PROVISIONING_SKIPPED'
    )),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);

-- 3. RLS on payment_events (service role only - used by webhooks)
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on payment_events"
    ON payment_events FOR ALL
    USING (auth.role() = 'service_role');

-- 4. RLS on audit_events (service role writes, users can read their own)
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on audit_events"
    ON audit_events FOR ALL
    USING (auth.role() = 'service_role');
CREATE POLICY "Users can view their own audit_events"
    ON audit_events FOR SELECT
    USING (auth.uid() = user_id);
