-- 1. ADICIONAR COLUNA PUBLIC_TOKEN NA TABELA DE CLIENTES
ALTER TABLE public.clients
ADD COLUMN public_token uuid DEFAULT gen_random_uuid();

-- 2. GARANTIR QUE A COLUNA É ÚNICA PARA EVITAR QUALQUER COLISÃO
ALTER TABLE public.clients
ADD CONSTRAINT unique_public_token UNIQUE (public_token);

-- 3. GARANTIR QUE OS EXISTENTES RECEBAM UM TOKEN
UPDATE public.clients SET public_token = gen_random_uuid() WHERE public_token IS NULL;

-- 4. CRIAR A FUNÇÃO (RPC) RPC QUE RETORNA OS DADOS DO CLIENTE PELO TOKEN
-- Essa função permite que um usuário não logado (anônimo) consulte *apenas* 
-- os dados ligados a esse token específico, ignorando o RLS principal de forma segura.
CREATE OR REPLACE FUNCTION get_public_client_data(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client RECORD;
    v_programs JSONB;
    v_operations JSONB;
    v_branding JSONB;
    v_result JSONB;
BEGIN
    -- 4.1 Buscar o Cliente
    SELECT id, name, cpf, birth_date as birthDate, email, organization_id
    INTO v_client
    FROM public.clients
    WHERE public_token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL; -- Token inválido ou cliente não existe
    END IF;

    -- 4.2 Buscar as Cores e Logomarca da Agência (Branding) para o White Label
    -- Opcional: só busca se existir na tabela white_label_settings
    v_branding := NULL;
    BEGIN
        SELECT jsonb_build_object(
            'logo_url', logo_url,
            'primary_color', primary_color,
            'theme', theme
        ) INTO v_branding
        FROM public.white_label_settings
        WHERE organization_id = v_client.organization_id
        LIMIT 1;
    EXCEPTION WHEN undefined_table THEN
        -- Ignora se a tabela não existir
        v_branding := NULL;
    END;

    -- 4.3 Buscar todos os Programas (Cartões) do Cliente
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'program_name', name,
            'points_balance', balance,
            'expiration_date', NULL,
            'qualification_category', NULL
        )
    ), '[]'::jsonb)
    INTO v_programs
    FROM public.programs
    WHERE client_id = v_client.id;

    -- 4.4 Buscar as Movimentações do Cliente para o Histórico
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'operation_type', 
                CASE
                    WHEN type = 'Venda' THEN 'sale'
                    ELSE 'redemption'
                END,
            'miles_amount', amount,
            'status', 'completed',
            'created_at', date
        ) ORDER BY date DESC
    ), '[]'::jsonb)
    INTO v_operations
    FROM public.movements
    WHERE client_id = v_client.id
    LIMIT 20;

    -- 4.5 Montar o Resumo (JSON Final Protegido)
    v_result := jsonb_build_object(
        'client', jsonb_build_object(
            'full_name', v_client.name,
            'cpf', v_client.cpf,
            'email', v_client.email,
            'phone', NULL
        ),
        'agency_branding', v_branding,
        'programs', v_programs,
        'recent_operations', v_operations
    );

    RETURN v_result;
END;
$$;
