import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findDuplicates() {
    console.log('Searching for all "Paulo Rocca" or "Paulo Roca" records...');
    
    // Search in clients table
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .or('name.ilike.%Paulo Rocca%,name.ilike.%Paulo Roca%');

    if (error) {
        console.error('Error searching clients:', error.message);
    } else {
        console.log('--- Matching Clients ---');
        console.table(clients);
    }

    // Also check for movements that might be orphaned or linked to other IDs
    const { data: moves, error: errMoves } = await supabase
        .from('movements')
        .select('*, client:client_id(name)')
        .eq('economy_generated', -1770.04);
    
    if (errMoves) {
        console.error('Error searching movements:', errMoves.message);
    } else {
        console.log('\n--- Movements with Economy -1770.04 ---');
        console.table(moves);
    }
}

findDuplicates();
