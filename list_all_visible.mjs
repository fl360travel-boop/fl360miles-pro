import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
    console.log('Fetching all visible clients...');
    const { data, error } = await supabase.from('clients').select('id, name, organization_id, user_id');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Total visible: ${data?.length || 0}`);
        console.table(data);
    }
}

listAll();
