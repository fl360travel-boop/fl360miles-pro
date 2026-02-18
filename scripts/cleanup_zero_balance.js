/**
 * Script para remover programas com saldo zero ou negativo do Supabase
 * Execute via Node.js: node scripts/cleanup_zero_balance.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'sb_publishable_jmvr_it3_mDMBekUjOeQQg_LrMQ4uPi';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupZeroBalance() {
    console.log('🔍 Buscando programas com saldo <= 0...');

    // Buscar programas com saldo zero ou negativo
    const { data: programs, error } = await supabase
        .from('programs')
        .select('*')
        .lte('balance', 0);

    if (error) {
        console.error('Erro ao buscar:', error);
        return;
    }

    console.log(`📊 Programas encontrados: ${programs.length}`);

    if (programs.length === 0) {
        console.log('✅ Nenhum programa com saldo <= 0 encontrado!');
        return;
    }

    // Listar
    console.log('\n📋 PROGRAMAS A REMOVER:');
    console.log('='.repeat(80));

    for (const p of programs) {
        console.log(`- ${p.name}: ${p.balance} mi (Cliente: ${p.client_id})`);
    }

    // Deletar
    const ids = programs.map(p => p.id);

    console.log(`\n🗑️  Removendo ${ids.length} programas...`);

    const { error: deleteError } = await supabase
        .from('programs')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error('❌ Erro ao deletar:', deleteError);
        return;
    }

    console.log('✅ Programas removidos com sucesso!');
}

cleanupZeroBalance().catch(console.error);
