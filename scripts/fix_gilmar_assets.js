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

async function fixGilmar() {
    console.log('Searching for client Gilmar...');

    // Find Client with name like "Gilmar"
    const { data: clients, error: cErr } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', '%Gilmar%');

    if (cErr || !clients || clients.length === 0) {
        console.error('Client Gilmar not found');
        return;
    }

    const client = clients[0];
    console.log(`Found client: ${client.name} (${client.id})`);

    // Get History
    const { data: history, error: hErr } = await supabase
        .from('movements')
        .select('*')
        .eq('client_id', client.id);

    if (hErr || !history) {
        console.error('Failed to fetch history');
        return;
    }

    console.log(`Found ${history.length} movements in history.`);

    // Logic from Frontend
    const balMap = new Map();
    const nameMap = new Map();

    history.forEach(h => {
        const key = h.program.trim().toLowerCase();
        if (!key) return;

        if (!nameMap.has(key)) nameMap.set(key, h.program.trim());

        let factor = 1;
        // Check types: Venda, Resgate are negative
        if (['Venda', 'Resgate'].includes(h.type)) factor = -1;

        const current = balMap.get(key) || 0;
        // In DB, amount is a number, so we can use it directly
        const amt = Number(h.amount) || 0;
        balMap.set(key, current + (amt * factor));
    });

    console.log('Calculated Balances:', Object.fromEntries(balMap));

    // Delete existing programs
    await supabase.from('programs').delete().eq('client_id', client.id);

    // Insert new programs
    const programsToInsert = [];
    balMap.forEach((balance, key) => {
        const displayName = nameMap.get(key) || key;
        programsToInsert.push({
            client_id: client.id,
            name: displayName,
            balance: balance,
            icon: 'diamond'
        });
    });

    if (programsToInsert.length > 0) {
        const { error: insErr } = await supabase.from('programs').insert(programsToInsert);
        if (insErr) {
            console.error('Failed to update programs:', insErr);
        } else {
            console.log(`Successfully updated ${programsToInsert.length} programs for Gilmar.`);
        }
    } else {
        console.log('No programs to insert.');
    }
}

fixGilmar();
