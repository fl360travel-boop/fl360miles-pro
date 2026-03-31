import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

const clientId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45';

async function fixResgate() {
    console.log('=== CORRIGINDO RESGATE DO PAULO ===\n');

    const { data, error } = await supabase
        .from('movements')
        .update({
            ticket_value: 615,
            economy_generated: 3950,
            observation: 'Resgate de 215000 mi via Azul Fidelidade. Economia: R$ 3.950,00. 2 Pax • Econômica. (Pagante: R$ 615,00 taxas)'
        })
        .eq('client_id', clientId)
        .eq('type', 'Resgate')
        .eq('date', '2026-03-23')
        .eq('amount', 215000)
        .select();

    if (error) {
        console.error('ERRO:', error);
    } else {
        console.log('✅ Resgate atualizado:', data?.length, 'registros');
        console.log('   ticket_value: 615');
        console.log('   economy_generated: 3950');
    }

    // Verify
    console.log('\n=== VERIFICAÇÃO FINAL ===\n');
    const { data: moves } = await supabase
        .from('movements')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    let totalSaving = 0;
    for (const m of moves) {
        if (m.type === 'Inclusão' || m.type === 'Inclusao') continue;
        
        let profit = Number(m.profit || 0);
        if (!profit && m.type === 'Venda' && m.negotiated_value && m.amount) {
            const cpm = Number(m.cpm || 15.00);
            profit = Number(m.negotiated_value) - ((Number(m.amount) / 1000) * cpm);
        }
        
        if (m.type === 'Venda') {
            totalSaving += profit;
            console.log(`${m.date} | ${m.type} | profit=${profit}`);
        } else {
            totalSaving += Number(m.economy_generated || 0) + profit;
            console.log(`${m.date} | ${m.type} | eco=${m.economy_generated} | profit=${profit}`);
        }
    }
    
    console.log(`\nEconomia Total (lifetimeSaving): R$ ${totalSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

fixResgate();
