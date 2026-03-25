import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRocca() {
    console.log('Inspecting "Paulo Rocca" details...');
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', '503b1bbb-3a68-48db-a97a-fb0878ad4c45')
        .single();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log('--- Client Record ---');
    console.log(`Name: ${client.name}`);
    console.log(`Email: ${client.email}`);
    console.log(`Phone: ${client.phone}`);
    console.log(`CPF: ${client.cpf}`);
    console.log(`Status: ${client.status}`);
    console.log(`Region: ${client.region}`);
    console.log(`Management Level: ${client.management_level}`);
    console.log(`Notes: ${client.notes}`);
    
    // Check if he has any "Venda" movements that might be missing data
    const { data: sales } = await supabase.from('movements').select('*').eq('client_id', client.id).eq('type', 'Venda');
    console.log('\n--- Sales (Vendas) ---');
    console.table(sales);
}

inspectRocca();
