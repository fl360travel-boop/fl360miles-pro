import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaulo() {
    // First find Paulo
    const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, name')
        .ilike('name', '%paulo%');
    
    console.log('=== CLIENTS WITH PAULO ===');
    console.log(clients);
    if (clientErr) console.error('Client error:', clientErr);
    
    if (!clients || clients.length === 0) {
        console.log('No Paulo found');
        return;
    }
    
    for (const client of clients) {
        console.log(`\n=== MOVEMENTS FOR ${client.name} (${client.id}) ===\n`);
        
        const { data: moves, error: moveErr } = await supabase
            .from('movements')
            .select('*')
            .eq('client_id', client.id)
            .order('date', { ascending: false });
        
        if (moveErr) {
            console.error('Move error:', moveErr);
            continue;
        }
        
        if (!moves || moves.length === 0) {
            console.log('No movements found');
            continue;
        }
        
        let totalEco = 0;
        let totalProfit = 0;
        
        for (const m of moves) {
            console.log(`Date: ${m.date} | Type: ${m.type} | Program: ${m.program} | Amount: ${m.amount}`);
            console.log(`  economy_generated: ${m.economy_generated}`);
            console.log(`  negotiated_value: ${m.negotiated_value}`);
            console.log(`  ticket_value: ${m.ticket_value}`);
            console.log(`  cpm: ${m.cpm}`);
            console.log(`  profit: ${m.profit}`);
            console.log(`  description: ${m.description}`);
            console.log(`  observation: ${m.observation}`);
            console.log('---');
            
            if (m.type !== 'Inclusão' && m.type !== 'Inclusao') {
                totalEco += Number(m.economy_generated || 0);
                
                let profit = Number(m.profit || 0);
                if (!profit && m.type === 'Venda' && m.negotiated_value && m.amount) {
                    const cpm = Number(m.cpm || 15.00);
                    profit = Number(m.negotiated_value) - ((Number(m.amount) / 1000) * cpm);
                }
                totalProfit += profit;
            }
        }
        
        console.log('\n=== CALCULATED TOTALS ===');
        console.log(`Total economyGenerated (non-Inclusão): ${totalEco}`);
        console.log(`Total profit (from Venda fallback): ${totalProfit}`);
        console.log(`lifetimeSaving (eco + profit): ${totalEco + totalProfit}`);
    }
}

checkPaulo();
