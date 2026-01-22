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

async function fixData() {
    console.log('Starting data fix...');

    const { data: movements, error } = await supabase
        .from('movements')
        .select('*');

    if (error) {
        console.error('Failed to fetch movements:', error.message);
        return;
    }

    console.log(`Found ${movements.length} movements.`);

    let updatedCount = 0;

    for (const m of movements) {
        let shouldUpdate = false;
        let newVal = m.negotiated_value;
        let newEco = m.economy_generated;

        // Condition 1: Inclusão without negotiated_value
        if ((m.type === 'Inclusão' || m.type === 'Compra') && !m.negotiated_value && m.amount) {
            // Apply R$ 18,50/k rule
            const calculated = Math.round((m.amount / 1000) * 18.50 * 100) / 100;
            newVal = calculated;
            newEco = calculated; // Treat as potential economy reference too
            shouldUpdate = true;
            console.log(`[FIX] ${m.type} for Client ${m.client_id} (Prog: ${m.program}): Set Value R$ ${calculated}`);
        }

        // Condition 2: Ensure economy_generated is set for Inclusão if missing
        if (m.type === 'Inclusão' && !m.economy_generated && m.amount) {
            const calculated = Math.round((m.amount / 1000) * 18.50 * 100) / 100;
            newEco = calculated;
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            const { error: updateError } = await supabase
                .from('movements')
                .update({
                    negotiated_value: newVal,
                    economy_generated: newEco
                })
                .eq('id', m.id);

            if (updateError) {
                console.error(`Failed to update movement ${m.id}:`, updateError.message);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`Fix complete. Updated ${updatedCount} records.`);
}

fixData();
