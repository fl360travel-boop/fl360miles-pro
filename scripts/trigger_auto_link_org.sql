-- =============================================
-- AUTOMACAO DE VINCULO DE DADOS (SAAS) - CORRECTED
-- =============================================
-- Este script resolve o "Bug Silencioso" de dados órfãos.
-- Carimba automaticamente a organization_id do usuário criador.

-- 1. Função Mestra: Acha a Organização do Usuário e Carimba o Dado
CREATE OR REPLACE FUNCTION public.auto_assign_organization()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Se já veio preenchido (pelo Frontend), não mexe.
    IF NEW.organization_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Busca a Primeira Organização onde o usuário é Membro
    SELECT organization_id INTO user_org_id
    FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    -- Se achou uma organização, carimba o dado com ela
    IF user_org_id IS NOT NULL THEN
        NEW.organization_id := user_org_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Gatilhos (Triggers) para cada tabela importante

-- CLIENTES
DROP TRIGGER IF EXISTS on_client_created_link_org ON public.clients;
CREATE TRIGGER on_client_created_link_org
    BEFORE INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- PROGRAMAS (Milhas)
DROP TRIGGER IF EXISTS on_program_created_link_org ON public.programs;
CREATE TRIGGER on_program_created_link_org
    BEFORE INSERT ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- CARTÕES
DROP TRIGGER IF EXISTS on_card_created_link_org ON public.cards;
CREATE TRIGGER on_card_created_link_org
    BEFORE INSERT ON public.cards
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- CARTEIRA (Movements)
DROP TRIGGER IF EXISTS on_movement_created_link_org ON public.movements;
CREATE TRIGGER on_movement_created_link_org
    BEFORE INSERT ON public.movements
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- HISTÓRICO DE ECONOMIA
DROP TRIGGER IF EXISTS on_economy_created_link_org ON public.economy_history;
CREATE TRIGGER on_economy_created_link_org
    BEFORE INSERT ON public.economy_history
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_organization();

-- Mensagem de Confirmação (Dentro de bloco DO para evitar erro de sintaxe)
DO $$
BEGIN
    RAISE NOTICE 'Automação de Vínculo de Dados Instalada com Sucesso!';
END $$;
