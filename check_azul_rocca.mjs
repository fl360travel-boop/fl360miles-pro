import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAzul() {
    const clientId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45';
    console.log(`Checking for Azul movements for Client ID: ${clientId}`);

    const { data: moves } = await supabase
        .from('movements')
        .select('*')
        .eq('client_id', clientId)
        .ilike('program', '%Azul%');

    console.log('\n--- AZUL MOVEMENTS ---');
    console.table(moves);
}

checkAzul();
