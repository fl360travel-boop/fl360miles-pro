import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bciyvdazxnzegcsxohrh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjaXl2ZGF6eG56ZWdjc3hvaHJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxNDE2NiwiZXhwIjoyMDgzODkwMTY2fQ.FDsiYqGBNUTEwupSHdoZNDOixbtGcqBrrLrrhTpMAb0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function unifyRoberta() {
    const memberId = '70305151-54b9-4a0b-8f19-3221975e5f58';
    const targetProgramId = '8899aabb-ccdd-eeff-1122-334455667788'; // Azul Fidelidade
    const sourceProgramId = '917eeb55-4422-4433-8877-556677889900'; // Azul
    
    console.log(`Unifying programs for Member ID: ${memberId}`);

    // 1. Update Azul Fidelidade balance to 235,000
    const { data: updateProg, error: errProg } = await supabase
        .from('programs')
        .update({ balance: 235000 })
        .eq('id', targetProgramId)
        .select();

    if (errProg) {
        console.error('Error updating target program:', errProg.message);
        return;
    }
    console.log('Target program updated:', updateProg);

    // 2. Update movements from "Azul" to "Azul Fidelidade"
    const { data: updateMoves, error: errMoves } = await supabase
        .from('movements')
        .update({ program: 'Azul Fidelidade' })
        .eq('member_id', memberId)
        .eq('program', 'Azul')
        .select();

    if (errMoves) {
        console.warn('Warning updating movements:', errMoves.message);
    } else {
        console.log(`Updated ${updateMoves?.length || 0} movements.`);
    }

    // 3. Delete the redundant "Azul" program
    const { error: errDel } = await supabase
        .from('programs')
        .delete()
        .eq('id', sourceProgramId);

    if (errDel) {
        console.error('Error deleting source program:', errDel.message);
    } else {
        console.log('Source program "Azul" deleted successfully.');
    }
}

unifyRoberta();
