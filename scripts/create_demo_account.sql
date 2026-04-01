-- ============================================================
-- SCRIPT: CONTA DEMO FL360 MILES
-- Executar no Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================
-- PASSO 1: Crie o usuário demo manualmente em:
--   Authentication > Users > Invite User
--   Email: demo@fl360miles.com.br
--   Senha: Demo@FL360
-- Depois copie o UUID gerado e substitua abaixo:

DO $$
DECLARE
    -- ⬇ Substitua pelo UUID real do usuário demo criado no Auth
    v_demo_user_id UUID := (
        SELECT id FROM auth.users WHERE email = 'demo@fl360miles.com.br' LIMIT 1
    );
    v_org_id UUID;
    v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;
BEGIN

    IF v_demo_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário demo não encontrado. Crie primeiro em Authentication > Users.';
    END IF;

    -- ============================================================
    -- 1. CRIAR ORGANIZAÇÃO DEMO
    -- ============================================================
    INSERT INTO organizations (id, name, slug, owner_id)
    VALUES (gen_random_uuid(), 'FL360 Miles Demo', 'demo-fl360', v_demo_user_id)
    ON CONFLICT (slug) DO UPDATE SET owner_id = v_demo_user_id
    RETURNING id INTO v_org_id;

    -- Adicionar como owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_demo_user_id, 'owner')
    ON CONFLICT DO NOTHING;

    -- Criar perfil do usuário demo
    INSERT INTO user_profiles (user_id, email, display_name, role)
    VALUES (v_demo_user_id, 'demo@fl360miles.com.br', 'Conta Demo', 'owner')
    ON CONFLICT (user_id) DO UPDATE SET display_name = 'Conta Demo';

    -- Criar tenant (branding)
    INSERT INTO tenants (user_id, company_name, plan, plan_status, trial_ends_at, max_clients)
    VALUES (v_demo_user_id, 'FL360 Miles', 'professional', 'demo',
            NOW() + INTERVAL '99 years', 999)
    ON CONFLICT (user_id) DO UPDATE SET plan = 'professional', plan_status = 'demo';

    -- Criar assinatura ativa
    INSERT INTO subscriptions (organization_id, plan_id, status, trial_ends_at, current_period_end)
    VALUES (v_org_id, 'professional', 'demo', NOW() + INTERVAL '99 years', NOW() + INTERVAL '99 years')
    ON CONFLICT DO NOTHING;

    -- ============================================================
    -- 2. CLIENTES FICTÍCIOS
    -- ============================================================
    SELECT gen_random_uuid() INTO v_c1;
    SELECT gen_random_uuid() INTO v_c2;
    SELECT gen_random_uuid() INTO v_c3;
    SELECT gen_random_uuid() INTO v_c4;
    SELECT gen_random_uuid() INTO v_c5;

    INSERT INTO clients (id, user_id, name, email, phone, cpf, birth_date, gender,
        marital_status, region, profession, start_date, management_fee,
        billing_cycle, management_level, payment_method, status, avatar, notes, preferences)
    VALUES
    (v_c1, v_demo_user_id,
        'Ricardo Mendes', 'ricardo.mendes@email.com', '(11) 99812-3456',
        '123.456.789-00', '1982-04-15', 'Masculino', 'Casado',
        'São Paulo - SP', 'Empresário', '2023-03-01', 1200,
        'Mensal', 'Elite', 'Cartão', 'active',
        'https://ui-avatars.com/api/?name=Ricardo+Mendes&background=1a2a4a&color=fff',
        'Cliente VIP. Viaja bastante a trabalho.', 'Prefere classe executiva. Foco em Star Alliance.'),

    (v_c2, v_demo_user_id,
        'Fernanda Costa', 'fernanda.costa@email.com', '(21) 98765-4321',
        '234.567.890-11', '1990-08-22', 'Feminino', 'Solteira',
        'Rio de Janeiro - RJ', 'Dentista', '2023-06-15', 800,
        'Mensal', 'Premium', 'Cartão', 'active',
        'https://ui-avatars.com/api/?name=Fernanda+Costa&background=2d4a6a&color=fff',
        'Viaja férias 2x por ano. Família com 2 filhos.', 'Prefere Smiles. Gosta de passagens baratas.'),

    (v_c3, v_demo_user_id,
        'Carlos Augusto Lima', 'carlos.lima@email.com', '(31) 97654-8901',
        '345.678.901-22', '1975-12-05', 'Masculino', 'Divorciado',
        'Belo Horizonte - MG', 'Advogado', '2024-01-10', 600,
        'Mensal', 'Standard', 'Boleto', 'active',
        'https://ui-avatars.com/api/?name=Carlos+Lima&background=3a4a2a&color=fff',
        'Cliente há 3 meses. Ainda aprendendo sobre milhas.', 'Foco em voos domésticos. LATAM Pass.'),

    (v_c4, v_demo_user_id,
        'Ana Paula Rodrigues', 'ana.rodrigues@email.com', '(41) 96543-7890',
        '456.789.012-33', '1995-03-30', 'Feminino', 'Casada',
        'Curitiba - PR', 'Médica', '2023-09-20', 1500,
        'Anual', 'Elite', 'Cartão', 'warning',
        'https://ui-avatars.com/api/?name=Ana+Rodrigues&background=4a2a3a&color=fff',
        'Tem saldo vencendo em breve! Milhas Azul.', 'Prefere destinos internacionais. Emirates.'),

    (v_c5, v_demo_user_id,
        'Thiago Barbosa', 'thiago.barbosa@email.com', '(85) 95432-6789',
        '567.890.123-44', '1988-07-18', 'Masculino', 'Casado',
        'Fortaleza - CE', 'Arquiteto', '2024-02-05', 500,
        'Mensal', 'Standard', 'A vista', 'idle',
        'https://ui-avatars.com/api/?name=Thiago+Barbosa&background=2a3a4a&color=fff',
        'Inativo últimos 2 meses. Acionar.', 'Foco em passagens para Europa.');

    -- ============================================================
    -- 3. PROGRAMAS DE MILHAS
    -- ============================================================
    INSERT INTO programs (client_id, name, balance, icon) VALUES
    -- Ricardo Mendes
    (v_c1, 'LATAM Pass', 485000, '🔵'), (v_c1, 'Smiles', 320000, '🟠'), (v_c1, 'Livelo', 215000, '🔴'),
    -- Fernanda Costa
    (v_c2, 'Smiles', 128000, '🟠'), (v_c2, 'LATAM Pass', 95000, '🔵'), (v_c2, 'TudoAzul', 62000, '🔷'),
    -- Carlos Lima
    (v_c3, 'LATAM Pass', 54000, '🔵'), (v_c3, 'Livelo', 28000, '🔴'),
    -- Ana Paula
    (v_c4, 'TudoAzul', 310000, '🔷'), (v_c4, 'Smiles', 195000, '🟠'), (v_c4, 'American AA', 87000, '🌐'),
    -- Thiago
    (v_c5, 'Smiles', 42000, '🟠'), (v_c5, 'LATAM Pass', 18000, '🔵');

    -- ============================================================
    -- 4. CARTÕES DE CRÉDITO
    -- ============================================================
    INSERT INTO cards (client_id, bank, name, category) VALUES
    (v_c1, 'Itaú', 'Itaú Personnalité Visa Infinite', 'Infinite'),
    (v_c1, 'Bradesco', 'Bradesco Black Amex', 'Black'),
    (v_c2, 'Nubank', 'Nubank Ultravioleta', 'Black'),
    (v_c2, 'C6 Bank', 'C6 Carbon', 'Black'),
    (v_c3, 'Santander', 'Santander Unlimited', 'Black'),
    (v_c4, 'Itaú', 'Itaú Personnalité Mastercard Black', 'Black'),
    (v_c4, 'Bradesco', 'Bradesco Premium Visa Infinite', 'Infinite'),
    (v_c5, 'Inter', 'Inter Black Mastercard', 'Black');

    -- ============================================================
    -- 5. HISTÓRICO DE MOVIMENTAÇÕES
    -- ============================================================
    INSERT INTO movements (client_id, date, type, program, amount, description,
        negotiated_value, economy_generated, passengers, flight_class, ticket_value, cpm, profit) VALUES

    -- Ricardo Mendes - histórico rico
    (v_c1, '2024-03-15', 'Emissão', 'LATAM Pass', 180000,
        'Passagem São Paulo → Miami (Executiva)', 3200, 8400, 2, 'Executiva', 11600, 0.064, 1800),
    (v_c1, '2024-02-10', 'Compra', 'Livelo', 100000,
        'Compra de milhas via parceiro', 2800, NULL, NULL, NULL, NULL, 0.028, NULL),
    (v_c1, '2024-01-20', 'Emissão', 'Smiles', 95000,
        'Passagem Rio de Janeiro → Lisboa (Econômica)', 890, 2100, 1, 'Econômica', 2990, 0.031, 420),
    (v_c1, '2023-12-05', 'Venda', 'LATAM Pass', 120000,
        'Venda de milhas excedentes', 3960, NULL, NULL, NULL, NULL, 0.033, NULL),
    (v_c1, '2023-11-18', 'Transferência', 'Livelo', 50000,
        'Transferência Bradesco → Livelo', NULL, NULL, NULL, NULL, NULL, NULL, NULL),

    -- Fernanda Costa
    (v_c2, '2024-03-01', 'Emissão', 'Smiles', 62000,
        'Passagem São Paulo → Orlando (Econômica)', 750, 1800, 2, 'Econômica', 2550, 0.041, 380),
    (v_c2, '2024-01-15', 'Compra', 'Smiles', 50000,
        'Compra de milhas promoção Smiles', 1350, NULL, NULL, NULL, NULL, 0.027, NULL),
    (v_c2, '2023-12-20', 'Emissão', 'LATAM Pass', 35000,
        'Passagem Fortaleza → São Paulo', 280, 620, 1, 'Econômica', 900, 0.026, 95),

    -- Carlos Lima
    (v_c3, '2024-02-28', 'Compra', 'LATAM Pass', 30000,
        'Compra de milhas LATAM', 780, NULL, NULL, NULL, NULL, 0.026, NULL),
    (v_c3, '2024-01-10', 'Emissão', 'LATAM Pass', 24000,
        'Passagem Belo Horizonte → São Paulo (Econômica)', 210, 390, 1, 'Econômica', 600, 0.025, 65),

    -- Ana Paula Rodrigues
    (v_c4, '2024-03-20', 'Emissão', 'TudoAzul', 195000,
        'Passagem São Paulo → Dubai (Executiva)', 4800, 9200, 2, 'Executiva', 14000, 0.072, 2600),
    (v_c4, '2024-02-14', 'Compra', 'Smiles', 80000,
        'Compra milhas dia dos namorados 🔥', 1760, NULL, NULL, NULL, NULL, 0.022, NULL),
    (v_c4, '2024-01-08', 'Venda', 'TudoAzul', 50000,
        'Venda parcial para cobrir resgate', 1500, NULL, NULL, NULL, NULL, 0.030, NULL),

    -- Thiago Barbosa
    (v_c5, '2024-01-20', 'Compra', 'Smiles', 25000,
        'Compra inicial de milhas', 650, NULL, NULL, NULL, NULL, 0.026, NULL),
    (v_c5, '2023-12-10', 'Emissão', 'LATAM Pass', 18000,
        'Passagem Fortaleza → São Paulo', 190, 370, 1, 'Econômica', 560, 0.031, 55);

    -- ============================================================
    -- 6. HISTÓRICO DE ECONOMIA (gráficos)
    -- ============================================================
    INSERT INTO economy_history (client_id, month, economy_percent, mileage_growth) VALUES
    (v_c1, '2023-10', 18.5, 12.3),
    (v_c1, '2023-11', 22.1, 15.8),
    (v_c1, '2023-12', 28.4, 18.2),
    (v_c1, '2024-01', 31.2, 22.5),
    (v_c1, '2024-02', 35.8, 25.1),
    (v_c1, '2024-03', 42.3, 28.7),

    (v_c2, '2023-10', 12.0, 8.5),
    (v_c2, '2023-11', 14.5, 10.2),
    (v_c2, '2023-12', 18.2, 12.8),
    (v_c2, '2024-01', 20.1, 14.5),
    (v_c2, '2024-02', 22.8, 16.3),
    (v_c2, '2024-03', 26.4, 18.9),

    (v_c3, '2024-01', 5.2, 3.1),
    (v_c3, '2024-02', 8.3, 5.8),
    (v_c3, '2024-03', 11.5, 8.2),

    (v_c4, '2023-10', 25.0, 20.5),
    (v_c4, '2023-11', 28.3, 22.1),
    (v_c4, '2023-12', 32.5, 25.8),
    (v_c4, '2024-01', 38.2, 30.4),
    (v_c4, '2024-02', 44.1, 35.2),
    (v_c4, '2024-03', 51.8, 41.3),

    (v_c5, '2023-12', 4.5, 2.8),
    (v_c5, '2024-01', 6.2, 4.1),
    (v_c5, '2024-02', 5.8, 3.9);

    -- ============================================================
    -- 7. ALERTAS DE VENCIMENTO
    -- ============================================================
    INSERT INTO alerts (organization_id, client_id, program, amount, expiration_date, observation, status)
    VALUES
    (v_org_id, v_c4, 'TudoAzul', 85000, NOW() + INTERVAL '12 days',
        'Milhas vencem em 12 dias! Acionar cliente urgente.', 'pending'),
    (v_org_id, v_c1, 'Livelo', 40000, NOW() + INTERVAL '25 days',
        'Saldo Livelo precisa de atenção.', 'pending'),
    (v_org_id, v_c5, 'Smiles', 42000, NOW() + INTERVAL '45 days',
        'Cliente inativo. Planejar resgate antes do vencimento.', 'pending');

    RAISE NOTICE '✅ Conta demo criada com sucesso!';
    RAISE NOTICE '   Email: demo@fl360miles.com.br';
    RAISE NOTICE '   Senha: Demo@FL360';
    RAISE NOTICE '   Clientes criados: 5';
    RAISE NOTICE '   Movimentações: 15';
    RAISE NOTICE '   Alertas: 3';

END $$;
