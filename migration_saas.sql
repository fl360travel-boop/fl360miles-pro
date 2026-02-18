-- MIGRATION SCRIPT: v1 to SaaS (Multi-tenant)
-- Run this in Supabase SQL Editor

-- 1. Add user_id column to tables (initially nullable to avoid errors with existing data)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE programs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE economy_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_programs_user_id ON programs(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_user_id ON movements(user_id);
CREATE INDEX IF NOT EXISTS idx_economy_history_user_id ON economy_history(user_id);

-- 3. Enable RLS (if not already)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_history ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing permissive policies (if any)
DROP POLICY IF EXISTS "Allow all operations on clients" ON clients;
DROP POLICY IF EXISTS "Allow all operations on programs" ON programs;
DROP POLICY IF EXISTS "Allow all operations on cards" ON cards;
DROP POLICY IF EXISTS "Allow all operations on movements" ON movements;
DROP POLICY IF EXISTS "Allow all operations on economy_history" ON economy_history;

-- 5. Create new SaaS Policies (Strict isolation)

-- CLIENTS
CREATE POLICY "Users can view their own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- PROGRAMS
CREATE POLICY "Users can view their own programs" ON programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own programs" ON programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own programs" ON programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own programs" ON programs FOR DELETE USING (auth.uid() = user_id);

-- CARDS
CREATE POLICY "Users can view their own cards" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cards" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON cards FOR DELETE USING (auth.uid() = user_id);

-- MOVEMENTS
CREATE POLICY "Users can view their own movements" ON movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own movements" ON movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own movements" ON movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own movements" ON movements FOR DELETE USING (auth.uid() = user_id);

-- ECONOMY HISTORY
CREATE POLICY "Users can view their own economy history" ON economy_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own economy history" ON economy_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own economy history" ON economy_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own economy history" ON economy_history FOR DELETE USING (auth.uid() = user_id);

-- 6. IMPORTANT: Assign existing data to YOUR user
-- UNCOMMENT the lines below and replace 'YOUR_UUID_HERE' with your actual User UID from Supabase Auth
-- You can find your UID adjacent to your email in the Authentication > Users table.

-- UPDATE clients SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE programs SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE cards SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE movements SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE economy_history SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;

-- 7. (Optional) Enforce Not Null after data fix
-- ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE programs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE cards ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE movements ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE economy_history ALTER COLUMN user_id SET NOT NULL;
