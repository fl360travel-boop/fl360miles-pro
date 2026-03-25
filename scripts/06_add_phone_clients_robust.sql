-- Script robusto para adicionar a coluna phone, tratando variações de nome
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Verifica se a tabela existe (case-insensitive ou variações)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
        RAISE NOTICE 'Sucesso: Coluna "phone" adicionada em public.clients';
    
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Clients') THEN
        ALTER TABLE public."Clients" ADD COLUMN IF NOT EXISTS phone TEXT;
        RAISE NOTICE 'Sucesso: Coluna "phone" adicionada em public."Clients"';

    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client') THEN
        ALTER TABLE public.client ADD COLUMN IF NOT EXISTS phone TEXT;
        RAISE NOTICE 'Sucesso: Coluna "phone" adicionada em public.client';

    ELSE
        -- Se não encontrar, lista as tabelas existentes para diagnóstico
        RAISE EXCEPTION 'Erro: Tabela de clientes não encontrada. Tabelas no banco: %', 
            (SELECT string_agg(table_name, ', ') FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
    END IF;
END $$;
