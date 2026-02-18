-- =============================================
-- FL360Miles BILLING MIGRATION (Asaas)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(255),
    asaas_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive', -- active, overdue, canceled
    plan_id VARCHAR(50), -- starter, pro, enterprise
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    amount DECIMAL(10, 2),
    next_due_date TIMESTAMP WITH TIME ZONE,
    payment_link VARCHAR(500), -- Link for Boleto/Pix
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add billing columns to tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';

-- 3. RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role (Edge Functions) can insert/update subscriptions
-- But for now we allow users to read.

-- 4. Audit log for payments (optional but good)
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    subscription_id UUID REFERENCES subscriptions(id),
    asaas_payment_id VARCHAR(255),
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method VARCHAR(50) -- PIX, BOLETO, CREDIT_CARD
);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Updated_at trigger
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
