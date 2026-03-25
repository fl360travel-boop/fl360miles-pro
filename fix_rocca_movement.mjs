import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMovement() {
    const moveId = '83cebb56-3db7-49dd-b56a-7e215b04367f';
    console.log(`Updating movement ID: ${moveId}`);

    const { data, error } = await supabase
        .from('movements')
        .update({
            negotiated_value: 1665,
            economy_generated: 1665,
            profit: 1665 // Assuming 0 cost for this transfer/sale for now or just reflecting the revenue
        })
        .eq('id', moveId)
        .select();

    if (error) {
        console.error('Error updating:', error.message);
    } else {
        console.log('Update successful:', data);
    }
}

fixMovement();
