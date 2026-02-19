-- FL360 Miles: Adicionar colunas Asaas à tabela subscriptions
-- Execute no Supabase SQL Editor

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);

-- Criar índice para busca rápida pelo webhook
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_sub_id 
ON subscriptions(asaas_subscription_id) 
WHERE asaas_subscription_id IS NOT NULL;

-- Criar UNIQUE constraint em organization_id para upsert funcionar
-- (se já existe, ignora)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_organization_id_key'
    ) THEN
        ALTER TABLE subscriptions 
        ADD CONSTRAINT subscriptions_organization_id_key 
        UNIQUE (organization_id);
    END IF;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Constraint já existe ou não aplicável: %', SQLERRM;
END $$;

SELECT 'Colunas Asaas adicionadas com sucesso!' AS resultado;
