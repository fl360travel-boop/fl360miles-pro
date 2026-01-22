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

async function verify() {
    console.log('Verifying table structure...');

    // Try to insert a dummy row with the new column 'passengers'
    // We use a non-existent client_id, expecting foreign key error if column exists,
    // or "column does not exist" error if it doesn't.
    // Actually, let's just select from it? No, select * might not show if we don't know the schema.
    // Insert is the best test.

    // Note: we need a valid UUID for client_id to avoid invalid input syntax, 
    // but we can rely on the fact that if 'passengers' is missing, it will fail BEFORE FK check usually? 
    // Or we can just try to update a non-existent row?
    // Let's try to select with the specific column.

    const { data, error } = await supabase
        .from('movements')
        .select('passengers') // Explicitly ask for this column
        .limit(1);

    if (error) {
        console.error('VERIFICATION RESULT: FAILURE');
        console.error('Error accessing movements table:', error.message);
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('\n>>> DIAGNOSIS: The database is MISSING the required columns. <<<');
            console.log('You MUST run the SQL command provided in the walkthrough.');
        }
    } else {
        console.log('VERIFICATION RESULT: SUCCESS');
        console.log('The column "passengers" exists.');
    }
}

verify();
