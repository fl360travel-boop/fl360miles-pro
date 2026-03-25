import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findRocca() {
    console.log('Searching for "Paulo Rocca"...');
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', '%Rocca%');

    if (error) {
        console.error('Error searching:', error.message);
        return;
    }

    if (clients && clients.length > 0) {
        console.log('Found clients:');
        console.table(clients);
    } else {
        console.log('No clients found with name like "Rocca".');
        
        // Try searching all clients just to see what's there
        const { data: all } = await supabase.from('clients').select('id, name').limit(10);
        console.log('Sample clients in DB:', all);
    }
}

findRocca();
