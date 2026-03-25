import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseKey === 'undefined' ? '' : supabaseUrl, supabaseKey);

async function inspectResgate() {
    const titularId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45';
    const { data: moves } = await supabase.from('movements').select('*').eq('client_id', titularId).eq('type', 'Resgate');
    console.log('\n--- RESGATE MOVEMENTS ---');
    console.table(moves);
}

inspectResgate();
