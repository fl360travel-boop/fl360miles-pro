-- ============================================================
-- MIGRAÇÃO: Tabela de Membros Familiares por Cliente
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Criar tabela de membros familiares
CREATE TABLE IF NOT EXISTS public.client_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    cpf         TEXT,
    birth_date  DATE,
    relationship TEXT NOT NULL DEFAULT 'Outro'
                 CHECK (relationship IN ('Cônjuge', 'Filho(a)', 'Pai/Mãe', 'Irmão/Irmã', 'Outro')),
    programs    JSONB NOT NULL DEFAULT '[]'::jsonb,
    cards       JSONB NOT NULL DEFAULT '[]'::jsonb,
    history     JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes       TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_members_client_id     ON public.client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_client_members_org_id        ON public.client_members(organization_id);

-- 3. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_client_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_members_updated_at ON public.client_members;
CREATE TRIGGER trg_client_members_updated_at
    BEFORE UPDATE ON public.client_members
    FOR EACH ROW EXECUTE FUNCTION public.set_client_members_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS (mesmo padrão multitenant do sistema)

-- SELECT: ver apenas membros da sua organização
DROP POLICY IF EXISTS "client_members_select" ON public.client_members;
CREATE POLICY "client_members_select" ON public.client_members
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: inserir apenas na sua organização
DROP POLICY IF EXISTS "client_members_insert" ON public.client_members;
CREATE POLICY "client_members_insert" ON public.client_members
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE: atualizar apenas na sua organização
DROP POLICY IF EXISTS "client_members_update" ON public.client_members;
CREATE POLICY "client_members_update" ON public.client_members
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- DELETE: remover apenas na sua organização
DROP POLICY IF EXISTS "client_members_delete" ON public.client_members;
CREATE POLICY "client_members_delete" ON public.client_members
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- 6. Confirmação
SELECT 'client_members table created successfully' AS status;
