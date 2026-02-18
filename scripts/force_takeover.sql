-- =============================================
-- SCRIPT DE RESGATE TOTAL (FORCE UPDATE)
-- =============================================
-- Este comando PEGA TODOS OS CLIENTES da tabela (sem exceção)
-- e transfere para o usuário fl360travel@gmail.com.
--
-- Use com cuidado: Se existirem outros assessores reais usando o sistema,
-- os clientes deles também virão para você.
-- Como você disse que quer restaurar "como estava antes", isso é o correto.

DO $$
DECLARE
    meu_id UUID;
    total_afetados INTEGER;
BEGIN
    -- 1. Pega seu ID pelo email confirmado
    SELECT id INTO meu_id FROM auth.users WHERE email = 'fl360travel@gmail.com';

    IF meu_id IS NULL THEN
        RAISE EXCEPTION 'Usuario fl360travel@gmail.com nao encontrado!';
    END IF;

    -- 2. Transfere TUDO para você
    UPDATE public.clients SET user_id = meu_id;
    GET DIAGNOSTICS total_afetados = ROW_COUNT;

    -- 3. Atualiza os dados relacionados
    -- (Não precisamos de WHERE complexo, apenas garanta que tudo aponte para você)
    UPDATE public.programs SET user_id = meu_id;
    UPDATE public.cards SET user_id = meu_id;
    UPDATE public.movements SET user_id = meu_id;
    UPDATE public.economy_history SET user_id = meu_id;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'RESGATE CONCLUÍDO';
    RAISE NOTICE 'Clientes transferidos para você: %', total_afetados;
    RAISE NOTICE '==================================================';

    IF total_afetados = 0 THEN
        RAISE NOTICE 'ALERTA VERMELHO: A tabela de clientes está VAZIA (0 registros). O problema é perda de dados, não acesso.';
    END IF;

END $$;
