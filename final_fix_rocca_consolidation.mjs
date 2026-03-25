import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function finalConsolidation() {
    const realClientId = '03b7e7ab-185d-4952-ba61-5918cd5eaa63';
    const robertaMemberId = '70305151-54b9-4a0b-8f19-3221975e5f58';
    const resgateId = '3a0f7bdf-45df-4561-9118-e69248f21974';
    const vendaId = '83cebb56-3db7-49dd-b56a-7e215b04367f';

    console.log(`Starting final fix for Real Paulo Rocca (ID: ${realClientId})`);

    // 1. Fix Resgate Financials
    const { error: errRes } = await supabase
        .from('movements')
        .update({ ticket_value: 6210, economy_generated: 3435 })
        .eq('id', resgateId);
    if (errRes) console.error('Error fixing Resgate:', errRes.message);
    else console.log('Resgate fixed.');

    // 2. Fix Venda Financials
    const { error: errVen } = await supabase
        .from('movements')
        .update({ negotiated_value: 1665, economy_generated: 1665, profit: 1665 })
        .eq('id', vendaId);
    if (errVen) console.error('Error fixing Venda:', errVen.message);
    else console.log('Venda fixed.');

    // 3. Link Roberta to the Real Paulo
    const { error: errRob } = await supabase
        .from('client_members')
        .update({ client_id: realClientId })
        .eq('id', robertaMemberId);
    if (errRob) console.error('Error linking Roberta:', errRob.message);
    else console.log('Roberta linked to Real Paulo.');

    // 4. Also link Roberta's programs directly to the Real Paulo (redundant but safe)
    const { error: errProg } = await supabase
        .from('programs')
        .update({ client_id: realClientId })
        .eq('member_id', robertaMemberId);
    if (errProg) console.warn('Warning linking Roberta programs:', errProg.message);

    console.log('Final consolidation complete.');
}

finalConsolidation();
