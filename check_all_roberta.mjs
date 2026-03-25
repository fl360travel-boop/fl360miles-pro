import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllRoberta() {
    const memberId = '70305151-54b9-4a0b-8f19-3221975e5f58';
    console.log(`Checking all assets for Roberta Rocca (ID: ${memberId})`);

    const { data: progs } = await supabase.from('programs').select('*').eq('member_id', memberId);
    console.log('\n--- ALL PROGRAMS for Roberta ---');
    console.table(progs);
}

checkAllRoberta();
