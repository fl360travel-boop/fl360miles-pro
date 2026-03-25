import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEconomy() {
    const moveId = '3a0f7bdf-45df-4561-9118-e69248f21974';
    console.log(`Updating Resgate movement ID: ${moveId}`);

    const { data, error } = await supabase
        .from('movements')
        .update({
            ticket_value: 6210,
            economy_generated: 3435
        })
        .eq('id', moveId)
        .select();

    if (error) {
        console.error('Error updating:', error.message);
    } else {
        console.log('Update successful:', data);
    }
}

fixEconomy();
