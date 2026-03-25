import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditAll() {
    const titularId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45'; // Paulo Rocca
    console.log(`Auditing ALL data for Paulo Rocca lineage...`);

    // 1. All movemets for Paulo (Titular)
    const { data: movesPaulo } = await supabase.from('movements').select('*').eq('client_id', titularId).is('member_id', null).order('date', { ascending: false });
    console.log('\n--- MOVEMENTS FOR PAULO (TITULAR) ---');
    console.table(movesPaulo);

    // 2. All family members
    const { data: members } = await supabase.from('client_members').select('*').eq('client_id', titularId);
    for (const member of members) {
        console.log(`\n--- MOVEMENTS FOR ${member.name} (${member.relationship}) ---`);
        const { data: movesMem } = await supabase.from('movements').select('*').eq('member_id', member.id).order('date', { ascending: false });
        console.table(movesMem);
    }
    
    // 3. Summarize economy calculation logic
    const allMoves = [...(movesPaulo || [])];
    if (members) {
        for (const member of members) {
            const { data: mm } = await supabase.from('movements').select('*').eq('member_id', member.id);
            if (mm) allMoves.push(...mm);
        }
    }

    let totalEconomy = 0;
    allMoves.forEach(h => {
        if (h.type === 'Inclusão') return;
        let profit = Number(h.profit) || 0;
        if (!profit && h.type === 'Venda' && h.negotiated_value && h.amount) {
            const estimatedCpm = Number(h.cpm) || 15.00;
            profit = Number(h.negotiated_value) - ((Number(h.amount) / 1000) * estimatedCpm);
        }
        const delta = (Number(h.economy_generated) || 0) + profit;
        totalEconomy += delta;
        console.log(`[Move ID: ${h.id}] Type: ${h.type}, Program: ${h.program}, EconomyGen: ${h.economy_generated}, Profit: ${profit}, Total Delta: ${delta}`);
    });

    console.log(`\nCALCULATED TOTAL ECONOMY: R$ ${totalEconomy.toFixed(2)}`);
}

auditAll();
