-- =============================================
-- SCRIPT DE DIAGNÓSTICO
-- =============================================
-- Execute este script para entender por que os clientes não aparecem.
-- O resultado aparecerá na aba "Results" do Supabase.

DO $$
DECLARE
    meu_id UUID;
    meu_email TEXT;
    total_clientes INTEGER;
    clientes_meus INTEGER;
    clientes_orfãos INTEGER;
    meu_perfil_role TEXT;
BEGIN
    -- 1. Identificar quem está rodando o script
    meu_id := auth.uid();
    SELECT email INTO meu_email FROM auth.users WHERE id = meu_id;

    -- 2. Contagens
    SELECT count(*) INTO total_clientes FROM public.clients;
    SELECT count(*) INTO clientes_meus FROM public.clients WHERE user_id = meu_id;
    SELECT count(*) INTO clientes_orfãos FROM public.clients WHERE user_id IS NULL;

    -- 3. Verificar Perfil (RBAC)
    SELECT role INTO meu_perfil_role FROM public.user_profiles WHERE user_id = meu_id;

    -- 4. Exibir Relatório
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'RELATÓRIO DE DIAGNÓSTICO';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Data/Hora: %', NOW();
    RAISE NOTICE '-----------------------------------------';
    RAISE NOTICE 'SEU USUÁRIO:';
    RAISE NOTICE ' - Email: %', meu_email;
    RAISE NOTICE ' - UUID: %', meu_id;
    RAISE NOTICE ' - Role (Perfil): %', COALESCE(meu_perfil_role, 'NÃO TEM PERFIL CRIADO!');
    RAISE NOTICE '-----------------------------------------';
    RAISE NOTICE 'ESTADO DOS CLIENTES:';
    RAISE NOTICE ' - Total no Banco: %', total_clientes;
    RAISE NOTICE ' - Vinculados a VOCÊ: %', clientes_meus;
    RAISE NOTICE ' - Sem Dono (Órfãos): %', clientes_orfãos;
    RAISE NOTICE '=========================================';

    IF clientes_meus = 0 THEN
        RAISE NOTICE 'ALERTA: Você tem 0 clientes vinculados. O script de correção pode não ter funcionado ou foi rodado em outro usuário.';
    END IF;

    IF meu_perfil_role IS NULL THEN
        RAISE NOTICE 'ALERTA CRÍTICO: Você não tem perfil na tabela user_profiles. Isso pode estar bloqueando seu acesso!';
    END IF;
END $$;
