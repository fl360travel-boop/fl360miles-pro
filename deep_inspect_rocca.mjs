import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepInspect() {
    const clientId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45';
    console.log(`Deep inspection for Client ID: ${clientId}`);

    // All Programs
    const { data: progs } = await supabase.from('programs').select('*').eq('client_id', clientId);
    console.log('\n--- ALL PROGRAMS ---');
    console.table(progs);

    // All Movements
    const { data: moves } = await supabase.from('movements').select('*').eq('client_id', clientId).order('date', { ascending: false });
    console.log('\n--- ALL MOVEMENTS ---');
    console.table(moves);
    
    // Check total points and value
    const totalPoints = progs?.reduce((acc, p) => acc + p.balance, 0) || 0;
    const estValue = totalPoints * 0.0185;
    console.log(`\nTotal Points: ${totalPoints}`);
    console.log(`Estimated Value (R$ 18,50/k): R$ ${estValue.toFixed(2)}`);
}

deepInspect();
