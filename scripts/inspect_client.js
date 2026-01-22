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

async function inspectClient() {
    console.log('Searching for Adriana Ortiz...');

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
    console.log('Client Found:', client.name, client.id);

    // 2. Fetch Programs
    const { data: programs } = await supabase.from('programs').select('*').eq('client_id', client.id);
    console.log('\n--- Programs ---');
    console.table(programs.map(p => ({ name: p.name, balance: p.balance })));

    // 3. Fetch History
    const { data: history } = await supabase.from('movements').select('*').eq('client_id', client.id).order('date');
    console.log('\n--- History ---');
    console.table(history.map(h => ({
        date: h.date,
        type: h.type,
        program: h.program,
        amount: h.amount,
        negotiated_value: h.negotiated_value,
        economy_generated: h.economy_generated,
        ticket_value: h.ticket_value,
        details: h.description
    })));

    // 4. Calculate Expected Metrics
    const totalInvested = history
        .filter(h => h.type === 'Compra' || h.type === 'Inclusão')
        .reduce((acc, h) => acc + (h.negotiated_value || h.economy_generated || 0), 0);

    console.log('\n--- Computed Metrics (Backend View) ---');
    console.log('Total Invested (Calculated):', totalInvested);
}

inspectClient();
