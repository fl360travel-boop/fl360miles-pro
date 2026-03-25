import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findRocca() {
    console.log('Searching for "Paulo Rocca" with Service Key...');
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', '%Rocca%');

    if (error) {
        console.error('Error searching:', error.message);
        return;
    }

    if (clients && clients.length > 0) {
        console.log(`Found ${clients.length} clients:`);
        console.table(clients);
        
        // Find programs and card for the first one
        const clientId = clients[0].id;
        const { data: progs } = await supabase.from('programs').select('*').eq('client_id', clientId);
        console.log('Programs:', progs);
        
        const { data: moves } = await supabase.from('movements').select('*').eq('client_id', clientId).order('date', { ascending: false }).limit(5);
        console.log('Recent Movements:', moves);

    } else {
        console.log('No clients found with name like "Rocca".');
        const { data: all } = await supabase.from('clients').select('id, name').limit(5);
        console.log('Sample clients in DB:', all);
    }
}

findRocca();
