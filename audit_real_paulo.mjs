import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditRealPaulo() {
    const titularId = '03b7e7ab-185d-4952-ba61-5918cd5eaa63'; // Real Paulo Rocca
    console.log(`Auditing REAL Paulo Rocca (ID: ${titularId})...`);

    // Movements
    const { data: movesPaulo } = await supabase.from('movements').select('*').eq('client_id', titularId).is('member_id', null);
    console.log('\n--- MOVEMENTS ---');
    console.table(movesPaulo);

    // Family
    const { data: members } = await supabase.from('client_members').select('*').eq('client_id', titularId);
    console.log('\n--- FAMILY MEMBERS ---');
    console.table(members);
    
    // Programs
    const { data: progs } = await supabase.from('programs').select('*').eq('client_id', titularId);
    console.log('\n--- PROGRAMS ---');
    console.table(progs);
}

auditRealPaulo();
