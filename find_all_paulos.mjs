import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllPaulos() {
    console.log('Searching for all "Paulo" variants...');
    const { data: clients, error } = await supabase
        .from('clients')
        .select('id, name, email, cpf, phone')
        .ilike('name', '%Paulo%');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Found ${clients.length} Paulos:`);
    console.table(clients);
}

findAllPaulos();
