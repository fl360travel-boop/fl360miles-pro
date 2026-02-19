/**
 * Teste Automatizado — Fase 1.5: Fluxo de Signup
 * 
 * Testa: Signup → Organização criada → Profile criado → Subscription trial
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jmvr_it3_mDMBekUjOeQQg_LrMQ4uPi';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = `test_signup_${Date.now()}@fl360test.com`;
const TEST_PASSWORD = 'Test123456!';
const TEST_COMPANY = 'Empresa Teste Automatizado';
const TEST_ADVISOR = 'Advisor Teste';

async function runTest() {
    console.log('='.repeat(60));
    console.log('🧪 TESTE AUTOMATIZADO — FASE 1.5: FLUXO DE SIGNUP');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🏢 Empresa: ${TEST_COMPANY}`);
    console.log(`👤 Advisor: ${TEST_ADVISOR}`);
    console.log('');

    // ============================================
    // PASSO 1: Criar conta (signUp)
    // ============================================
    console.log('━━━ PASSO 1: Criar conta via signUp ━━━');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });

    if (signUpError) {
        console.log(`❌ FALHA no signup: ${signUpError.message}`);
        return;
    }

    const userId = signUpData.user?.id;
    console.log(`✅ Conta criada! User ID: ${userId}`);
    console.log(`   Confirmação necessária: ${signUpData.user?.email_confirmed_at ? 'Não' : 'Sim'}`);
    console.log('');

    // Aguardar para trigger processar
    console.log('⏳ Aguardando 3s para trigger processar...');
    await new Promise(r => setTimeout(r, 3000));

    // ============================================
    // PASSO 2: Verificar se trigger criou o user_profile
    // ============================================
    console.log('━━━ PASSO 2: Verificar user_profile (trigger) ━━━');
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (profileError) {
        console.log(`⚠️  user_profile NÃO encontrado (trigger pode ter falhado): ${profileError.message}`);
    } else {
        console.log(`✅ user_profile encontrado!`);
        console.log(`   Role: ${profile.role}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Display Name: ${profile.display_name || '(não definido pelo trigger)'}`);
    }
    console.log('');

    // ============================================
    // PASSO 3: Verificar se trigger criou organização
    // ============================================
    console.log('━━━ PASSO 3: Verificar organização (trigger) ━━━');
    const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId);

    if (orgError) {
        console.log(`⚠️  organization_members erro: ${orgError.message}`);
    } else if (!orgMembers || orgMembers.length === 0) {
        console.log(`⚠️  Nenhuma organização vinculada ao usuário (trigger pode ter falhado)`);
    } else {
        console.log(`✅ Organização vinculada!`);
        console.log(`   Org ID: ${orgMembers[0].organization_id}`);
        console.log(`   Role: ${orgMembers[0].role}`);

        // Buscar detalhes da org
        const { data: org } = await supabase
            .from('organizations')
            .select('name, slug')
            .eq('id', orgMembers[0].organization_id)
            .single();

        if (org) {
            console.log(`   Org Name: ${org.name}`);
            console.log(`   Org Slug: ${org.slug}`);
        }
    }
    console.log('');

    // ============================================
    // PASSO 4: Chamar RPC handle_new_signup
    // ============================================
    console.log('━━━ PASSO 4: Chamar RPC handle_new_signup ━━━');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('handle_new_signup', {
        p_org_name: TEST_COMPANY,
        p_display_name: TEST_ADVISOR,
    });

    if (rpcError) {
        console.log(`❌ RPC FALHOU: ${rpcError.message}`);
        console.log(`   Código: ${rpcError.code}`);
        console.log(`   Detalhes: ${rpcError.details}`);
    } else {
        console.log(`✅ RPC executou com sucesso!`);
        console.log(`   Resultado: ${JSON.stringify(rpcResult, null, 2)}`);
    }
    console.log('');

    // ============================================
    // PASSO 5: Verificar estado final
    // ============================================
    console.log('━━━ PASSO 5: Verificar estado final ━━━');

    // Re-check profile
    const { data: finalProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (finalProfile) {
        console.log(`✅ Profile final:`);
        console.log(`   Role: ${finalProfile.role}`);
        console.log(`   Display Name: ${finalProfile.display_name}`);
        console.log(`   Email: ${finalProfile.email}`);
    } else {
        console.log(`❌ Profile não encontrado!`);
    }

    // Re-check org
    const { data: finalOrg } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId);

    if (finalOrg && finalOrg.length > 0) {
        const { data: orgDetails } = await supabase
            .from('organizations')
            .select('name, slug')
            .eq('id', finalOrg[0].organization_id)
            .single();

        console.log(`✅ Organização final:`);
        console.log(`   Name: ${orgDetails?.name}`);
        console.log(`   Slug: ${orgDetails?.slug}`);
    } else {
        console.log(`❌ Organização não encontrada!`);
    }

    // Check subscription
    const orgId = finalOrg?.[0]?.organization_id;
    if (orgId) {
        const { data: sub, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        if (sub) {
            console.log(`✅ Subscription encontrada:`);
            console.log(`   Plan: ${sub.plan_id}`);
            console.log(`   Status: ${sub.status}`);
            console.log(`   Trial até: ${sub.trial_ends_at}`);
        } else {
            console.log(`⚠️  Subscription não encontrada: ${subError?.message || 'sem erro'}`);
        }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('📊 RESUMO DO TESTE');
    console.log('='.repeat(60));
    console.log(`   Signup:        ${userId ? '✅' : '❌'}`);
    console.log(`   Profile:       ${finalProfile ? '✅' : '❌'}`);
    console.log(`   Organização:   ${finalOrg?.length > 0 ? '✅' : '❌'}`);
    console.log(`   RPC:           ${rpcError ? '❌ ' + rpcError.message : '✅'}`);
    console.log('='.repeat(60));

    // ============================================
    // CLEANUP: Deletar usuário de teste
    // ============================================
    console.log('');
    console.log('🧹 Nota: Usuário de teste criado. Pode ser removido via Supabase Dashboard > Authentication.');
    console.log(`   Email: ${TEST_EMAIL}`);
}

runTest().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
