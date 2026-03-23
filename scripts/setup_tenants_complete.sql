-- SUPER SCRIPT: CRIAÇÃO E CONFIGURAÇÃO COMPLETA DA TABELA TENANTS
-- Este script cria a tabela tenants e todas as colunas necessárias para Branding, Subdomínios e Redirecionamentos.

-- 1. Habilitar Extensões (se não estiverem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar a tabela Tenants (se não existir)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_logo TEXT,
    primary_color VARCHAR(7) DEFAULT '#E2BE6A',
    secondary_color VARCHAR(7) DEFAULT '#B8952E',
    subdomain TEXT UNIQUE,
    redirect_url TEXT,
    plan VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise')),
    plan_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
    max_clients INTEGER DEFAULT 10,
    asaas_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Segurança)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Segurança
DROP POLICY IF EXISTS "tenant_own_data" ON tenants;
CREATE POLICY "tenant_own_data" ON tenants
    FOR ALL USING (auth.uid() = user_id);

-- Permitir leitura pública por subdomínio (para branding carregar no acesso anônimo)
DROP POLICY IF EXISTS "Public view by subdomain" ON tenants;
CREATE POLICY "Public view by subdomain" ON tenants
    FOR SELECT USING (true);

-- 5. Criar Índices para Performance
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- 6. Adicionar colunas caso a tabela já exista (Garanti que nada falte)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_logo TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#E2BE6A';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#B8952E';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS redirect_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- 7. Trigger para data de atualização
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
