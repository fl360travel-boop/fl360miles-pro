-- =============================================
-- AUTOMAÇÃO VIP (AUTO-UPGRADE)
-- =============================================
-- Garante que se o Adriano ou a Demo se cadastrarem no futuro,
-- eles ganham o plano Elite/Lifetime IMEDIATAMENTE.

CREATE OR REPLACE FUNCTION public.auto_upgrade_vip_members()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    vip_emails TEXT[] := ARRAY[
        'fl360travel@gmail.com', 
        'demo@fl360travel.com.br', 
        'adriano.moraesnr@gmail.com'
    ];
BEGIN
    -- Busca o email do novo membro
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

    -- Se for dono e estiver na lista VIP
    IF NEW.role = 'owner' AND user_email = ANY(vip_emails) THEN
        -- Atualiza a assinatura da organização dele para Elite/Lifetime
        UPDATE public.subscriptions
        SET 
            plan_id = 'elite',
            status = 'active', -- Status 'active' (lifetime logicamente tratado na app)
            trial_ends_at = '2099-12-31 23:59:59',
            updated_at = NOW()
        WHERE organization_id = NEW.organization_id;
        
        RAISE NOTICE '👑 VIP Detectado (%): Plano atualizado para Lifetime.', user_email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela de MEMBROS (pois é lá que sabemos quem é o dono)
DROP TRIGGER IF EXISTS on_member_created_check_vip ON public.organization_members;
CREATE TRIGGER on_member_created_check_vip
    AFTER INSERT ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_upgrade_vip_members();

RAISE NOTICE '✅ Automação VIP instalada. Futuros cadastros VIP serão Elite automaticamente.';
