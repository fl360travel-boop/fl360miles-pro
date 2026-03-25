import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function identifyUser() {
    const userId = 'a4d87b91-a201-4a0e-8f55-0d87453e3031';
    const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('User Profile:', data);
    }
}

identifyUser();
