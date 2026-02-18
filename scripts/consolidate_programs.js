/**
 * Script para consolidar programas duplicados no Supabase
 * Execute via Node.js: node scripts/consolidate_programs.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'sb_publishable_jmvr_it3_mDMBekUjOeQQg_LrMQ4uPi';

const supabase = createClient(supabaseUrl, supabaseKey);

async function consolidatePrograms() {
    console.log('🔍 Buscando todos os programas...');

    // 1. Buscar todos os programas
    const { data: programs, error: progError } = await supabase
        .from('programs')
        .select('*')
        .order('client_id');

    if (progError) {
        console.error('Erro ao buscar programas:', progError);
        return;
    }

    console.log(`📊 Total de programas encontrados: ${programs.length}`);

    // 2. Agrupar por client_id e nome (lowercase para normalizar)
    const grouped = {};
    programs.forEach(p => {
        const key = `${p.client_id}_${p.name.toLowerCase().trim()}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(p);
    });

    // 3. Identificar duplicados
    const duplicates = Object.entries(grouped).filter(([_, items]) => items.length > 1);

    console.log(`\n⚠️  Grupos com duplicados: ${duplicates.length}`);

    if (duplicates.length === 0) {
        console.log('✅ Nenhum programa duplicado encontrado!');
        return;
    }

    // 4. Listar duplicados
    console.log('\n📋 DUPLICADOS ENCONTRADOS:');
    console.log('='.repeat(80));

    for (const [key, items] of duplicates) {
        const [clientId, name] = key.split('_');
        const totalBalance = items.reduce((sum, i) => sum + (i.balance || 0), 0);

        console.log(`\nCliente: ${clientId}`);
        console.log(`Programa: ${items[0].name}`);
        console.log(`Registros: ${items.length}`);
        console.log(`Saldos individuais: ${items.map(i => i.balance).join(', ')}`);
        console.log(`Saldo Total: ${totalBalance}`);
        console.log('-'.repeat(40));

        // 5. Consolidar: manter o primeiro, somar saldos, deletar os outros
        const keepId = items[0].id;
        const deleteIds = items.slice(1).map(i => i.id);

        console.log(`  → Manter ID: ${keepId}`);
        console.log(`  → Deletar IDs: ${deleteIds.join(', ')}`);
        console.log(`  → Novo saldo: ${totalBalance}`);

        // 6. Atualizar o programa mantido com o saldo total
        const { error: updateError } = await supabase
            .from('programs')
            .update({ balance: totalBalance })
            .eq('id', keepId);

        if (updateError) {
            console.error(`  ❌ Erro ao atualizar ${keepId}:`, updateError);
            continue;
        }

        // 7. Deletar os duplicados
        const { error: deleteError } = await supabase
            .from('programs')
            .delete()
            .in('id', deleteIds);

        if (deleteError) {
            console.error(`  ❌ Erro ao deletar duplicados:`, deleteError);
            continue;
        }

        console.log(`  ✅ Consolidado com sucesso!`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 CONSOLIDAÇÃO CONCLUÍDA!');
}

// Executar
consolidatePrograms().catch(console.error);
