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

async function diagnoseFlow() {
    console.log('--- START DIAGNOSIS ---');
    const timestamp = Date.now();
    const testName = `DEBUG_USER_${timestamp}`;

    // 1. Create Client
    console.log(`1. Creating Client: ${testName}`);
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
            name: testName,
            email: `debug_${timestamp}@test.com`,
            status: 'active'
        })
        .select()
        .single();

    if (clientError) {
        console.error('FAIL: Client Creation Failed');
        console.error(clientError);
        return;
    }
    console.log('SUCCESS: Client Created', client.id);

    // 2. Insert Program (Simulate the failing step)
    console.log('2. Inserting Program...');
    const programPayload = {
        client_id: client.id,
        name: 'Livelo Float Test',
        balance: 10000.55, // TEST FLOAT
        icon: 'diamond'
    };

    const { error: progError } = await supabase
        .from('programs')
        .insert([programPayload]);

    if (progError) {
        console.error('FAIL: Program Insertion Failed');
        console.error('Error Code:', progError.code);
        console.error('Message:', progError.message);
        console.error('Details:', progError.details);

        // Attempt Cleanup
        console.log('Attempting cleanup...');
        await supabase.from('clients').delete().eq('id', client.id);
    } else {
        console.log('SUCCESS: Program Inserted');
        // Cleanup success test
        await supabase.from('clients').delete().eq('id', client.id);
        console.log('Cleanup: Test client deleted.');
    }
    console.log('--- END DIAGNOSIS ---');
}

diagnoseFlow();
