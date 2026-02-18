-- =========================================================
-- SCRIPT FINAL DE CORREÇÃO: Restaurar Clientes para o Advisor
-- =========================================================
-- OBJETIVO: Fazer com que Adriano, Gilmar, Adriana, etc.
-- voltem a aparecer no login "fl360travel@gmail.com".
--
-- COMO FUNCIONA:
-- Este script pega todos os dados que hoje estão "sem dono" (user_id NULL)
-- e os entrega oficialmente para o usuário "fl360travel@gmail.com".
--
-- INSTRUÇÕES:
-- 1. Copie todo este código.
-- 2. No Supabase Dashboard, vá em SQL Editor.
-- 3. Cole e clique em RUN.
-- =========================================================

DO $$
DECLARE
    advisor_id UUID;
BEGIN
    -- 1. Encontrar o ID do usuário principal (Advisor)
    SELECT id INTO advisor_id FROM auth.users WHERE email = 'fl360travel@gmail.com' LIMIT 1;

    -- Se não encontrar o usuário, avisa (mas não deve acontecer se o email estiver certo)
    IF advisor_id IS NULL THEN
        RAISE EXCEPTION 'Usuário fl360travel@gmail.com não encontrado no sistema de autenticação.';
    END IF;

    -- 2. Vincular CLIENTES órfãos ao Advisor
    UPDATE public.clients 
    SET user_id = advisor_id 
    WHERE user_id IS NULL;

    -- 3. Vincular PROGRAMAS órfãos ao Advisor
    -- (Garante que se o cliente é do Advisor, o programa também é)
    UPDATE public.programs p
    SET user_id = advisor_id
    FROM public.clients c
    WHERE p.client_id = c.id
    AND c.user_id = advisor_id
    AND (p.user_id IS NULL OR p.user_id != advisor_id);

    -- 4. Vincular CARTÕES órfãos ao Advisor
    UPDATE public.cards cd
    SET user_id = advisor_id
    FROM public.clients c
    WHERE cd.client_id = c.id
    AND c.user_id = advisor_id
    AND (cd.user_id IS NULL OR cd.user_id != advisor_id);

    -- 5. Vincular MOVIMENTAÇÕES órfãs ao Advisor
    UPDATE public.movements m
    SET user_id = advisor_id
    FROM public.clients c
    WHERE m.client_id = c.id
    AND c.user_id = advisor_id
    AND (m.user_id IS NULL OR m.user_id != advisor_id);

    -- 6. Vincular HISTÓRICO DE ECONOMIA órfão ao Advisor
    UPDATE public.economy_history eh
    SET user_id = advisor_id
    FROM public.clients c
    WHERE eh.client_id = c.id
    AND c.user_id = advisor_id
    AND (eh.user_id IS NULL OR eh.user_id != advisor_id);

    RAISE NOTICE 'Correção concluída com sucesso! Todos os clientes órfãos agora pertencem a fl360travel@gmail.com';
END $$;
