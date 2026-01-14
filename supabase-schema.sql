-- FL360Miles Database Schema for Supabase
-- Run this SQL in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    birth_date DATE,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    region VARCHAR(100),
    profession VARCHAR(100),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    management_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'Mensal' CHECK (billing_cycle IN ('Mensal', 'Anual')),
    management_level VARCHAR(20) NOT NULL DEFAULT 'Standard' CHECK (management_level IN ('Standard', 'Premium', 'Elite')),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'A vista' CHECK (payment_method IN ('A vista', 'Cartão', 'Boleto')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'idle')),
    avatar TEXT DEFAULT '',
    notes TEXT,
    preferences TEXT,
    travel_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs table (loyalty programs linked to clients)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    icon VARCHAR(50) DEFAULT '✈️',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (credit cards linked to clients)
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    bank VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movements table (transaction history)
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(50) NOT NULL,
    program VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    observation TEXT,
    negotiated_value DECIMAL(10,2),
    economy_generated DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Economy history table
CREATE TABLE economy_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    economy_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    mileage_growth DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_programs_client_id ON programs(client_id);
CREATE INDEX idx_cards_client_id ON cards(client_id);
CREATE INDEX idx_movements_client_id ON movements(client_id);
CREATE INDEX idx_movements_date ON movements(date DESC);
CREATE INDEX idx_economy_history_client_id ON economy_history(client_id);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now, without authentication)
-- You can update these later when you add authentication
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on programs" ON programs FOR ALL USING (true);
CREATE POLICY "Allow all operations on cards" ON cards FOR ALL USING (true);
CREATE POLICY "Allow all operations on movements" ON movements FOR ALL USING (true);
CREATE POLICY "Allow all operations on economy_history" ON economy_history FOR ALL USING (true);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for clients table
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Team Members table (for admin team management)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'advisor', 'viewer')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    invited_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true);

-- Trigger for team_members
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
