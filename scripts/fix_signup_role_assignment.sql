-- Atualizar o trigger para dar role de owner para contas criadas via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user_unified()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    org_name TEXT;
    org_slug TEXT;
    v_role TEXT;
BEGIN
    -- Determinar role do usuario
    IF NEW.email = 'demo@fl360miles.com' THEN
        v_role := 'demo';
    ELSE
        -- Todo cadastro novo B2B vira owner do seu Tenant recém-criado
        v_role := 'owner';
    END IF;

    -- Criar perfil (sem conflito)
    INSERT INTO public.user_profiles (user_id, email, role, created_at)
    VALUES (NEW.id, NEW.email, v_role, NOW())
    ON CONFLICT (user_id) DO NOTHING;

    -- Criar organização padrão baseada no email
    org_name := split_part(NEW.email, '@', 1);
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || substring(md5(random()::text) from 1 for 6);

    INSERT INTO public.organizations (name, slug, created_at, updated_at)
    VALUES (org_name, org_slug, NOW(), NOW())
    RETURNING id INTO new_org_id;

    -- Vincular como Owner da Org recém criada
    INSERT INTO public.organization_members (organization_id, user_id, role, created_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW());

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log do erro mas NÃO bloqueia criação do usuário
        RAISE WARNING 'Erro no trigger handle_new_user_unified: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
