import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFamily() {
    const titularId = '503b1bbb-3a68-48db-a97a-fb0878ad4c45'; // Paulo Rocca
    console.log(`Checking family for Client ID: ${titularId}`);

    // Assuming family members are in a table like 'client_members' or similar
    // Let's check the schema again for family members
    const { data: members, error } = await supabase.from('client_members').select('*').eq('client_id', titularId);
    if (error) {
        console.error('Error fetching members:', error.message);
        return;
    }

    console.log('--- Family Members ---');
    console.table(members);
    
    for (const member of members) {
        if (member.name.includes('Roberta')) {
            console.log(`\nPrograms for ${member.name}:`);
            const { data: progs } = await supabase.from('programs').select('*').eq('member_id', member.id);
            console.table(progs);
            
            console.log(`\nMovements for ${member.name}:`);
            const { data: moves } = await supabase.from('movements').select('*').eq('member_id', member.id);
            console.table(moves);
        }
    }
}

checkFamily();
