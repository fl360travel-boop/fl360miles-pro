import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRoberta() {
    const memberId = '70305151-54b9-4a0b-8f19-3221975e5f58';
    console.log(`Deep inspection for Roberta Rocca (ID: ${memberId})`);

    // Movements for "Azul"
    const { data: movesAzul } = await supabase.from('movements').select('*').eq('member_id', memberId).eq('program', 'Azul');
    console.log('\n--- Movements for "Azul" ---');
    console.table(movesAzul);

    // Movements for "Azul Fidelidade"
    const { data: movesAzulFid } = await supabase.from('movements').select('*').eq('member_id', memberId).eq('program', 'Azul Fidelidade');
    console.log('\n--- Movements for "Azul Fidelidade" ---');
    console.table(movesAzulFid);
}

inspectRoberta();
