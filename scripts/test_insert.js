import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function testInsert() {
    console.log('Testing Insert...');

    // Get the new Adriana Ortiz ID from the previous step
    const CLIENT_ID = 'cfbc14ee-c69f-453c-8c23-52c9f5af9df2';

    console.log(`Attempting to insert program for client ${CLIENT_ID}`);

    const { data, error } = await supabase
        .from('programs')
        .insert([{
            client_id: CLIENT_ID,
            name: 'TEST_PROGRAM_DEBUG',
            balance: 100,
            icon: 'diamond'
        }])
        .select();

    if (error) {
        console.error('INSERT FAILED:', error);
    } else {
        console.log('INSERT SUCCESS:', data);
    }
}

testInsert();
