import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let PRE_URL = '';
let PRE_KEY = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        if (line.startsWith('VITE_SUPABASE_URL=')) PRE_URL = line.split('=')[1].trim();
        if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) PRE_KEY = line.split('=')[1].trim();
    });
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const supabase = createClient(PRE_URL, PRE_KEY);

async function cleanupClient() {
    console.log('Cleaning up Adriana Ortiz...');

    // 1. Find Client
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', '%Adriana Ortiz%');

    if (clientError || !clients?.length) {
        console.error('Client not found or error:', clientError?.message);
        return;
    }

    const client = clients[0];
    console.log('Client Found to Delete:', client.name, client.id);

    // 2. Delete (Cascade should handle related items, but we explicitly delete to be sure)
    // Deleting client should cascade, but manual delete is safer for strict cleanup
    const { error: delError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

    if (delError) {
        console.error('Failed to delete client:', delError.message);
    } else {
        console.log('SUCCESS: Client Adriana Ortiz has been removed.');
        console.log('You can now re-create the client cleanly.');
    }
}

cleanupClient();
