import { supabase, DbClient } from './supabase';

export interface Client {
    id: string;
    name: string;
    email: string;
    cpf?: string;
    birthDate?: string;
    gender?: string;
    maritalStatus?: string;
    region?: string;
    profession?: string;
    startDate: string;
    managementFee: number;
    billingCycle: 'Mensal' | 'Anual';
    managementLevel: 'Standard' | 'Premium' | 'Elite';
    paymentMethod: 'A vista' | 'Cartão' | 'Boleto';
    status: 'active' | 'warning' | 'idle';
    avatar: string;
    programs: Array<{ id: string; name: string; balance: number; icon: string }>;
    cards: Array<{ id: string; bank: string; name: string; category: string }>;
    history: Array<{
        id: string;
        date: string;
        type: string;
        program: string;
        amount: number;
        description: string;
        observation?: string;
        negotiatedValue?: number;
        economyGenerated?: number;
        passengers?: number;
        flightClass?: string;
        ticketValue?: number;
        cpm?: number;
        profit?: number;
        bonusPercent?: number;
    }>;
    notes: string;
    preferences: string;
    travelNotes: string;
    economyHistory: Array<{ month: string; economyPercent: number; mileageGrowth: number }>;
}

// Convert database format to frontend format
function dbToClient(db: DbClient, programs: any[], cards: any[], movements: any[], economyHistory: any[]): Client {
    return {
        id: db.id,
        name: db.name,
        email: db.email,
        cpf: db.cpf,
        birthDate: db.birth_date,
        gender: db.gender,
        maritalStatus: db.marital_status,
        region: db.region,
        profession: db.profession,
        startDate: db.start_date,
        managementFee: db.management_fee,
        billingCycle: db.billing_cycle,
        managementLevel: db.management_level,
        paymentMethod: db.payment_method,
        status: db.status,
        avatar: db.avatar,
        notes: db.notes || '',
        preferences: db.preferences || '',
        travelNotes: db.travel_notes || '',
        programs: programs.map(p => ({
            id: p.id,
            name: p.name,
            balance: p.balance,
            icon: p.icon
        })),
        cards: cards.map(c => ({
            id: c.id,
            bank: c.bank,
            name: c.name,
            category: c.category
        })),
        history: movements.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            program: m.program,
            amount: Number(m.amount || 0),
            description: m.description,
            observation: m.observation,
            negotiatedValue: m.negotiated_value ? Number(m.negotiated_value) : undefined,
            economyGenerated: (m.economyGenerated || m.economy_generated) ? Number(m.economyGenerated || m.economy_generated) : undefined,
            passengers: m.passengers ? Number(m.passengers) : undefined,
            flightClass: m.flightClass || m.flight_class,
            ticketValue: (m.ticketValue || m.ticket_value) ? Number(m.ticketValue || m.ticket_value) : undefined,
            cpm: m.cpm ? Number(m.cpm) : undefined,
            profit: m.profit ? Number(m.profit) : undefined,
            bonusPercent: m.bonusPercent || m.bonus_percent ? Number(m.bonusPercent || m.bonus_percent) : undefined
        })),
        economyHistory: economyHistory.map(e => ({
            month: e.month,
            economyPercent: Number(e.economy_percent || 0),
            mileageGrowth: Number(e.mileage_growth || 0)
        }))
    };
}

// GET all clients
export async function getClients(): Promise<Client[]> {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

    if (error) throw new Error(`Failed to fetch clients: ${error.message}`);
    if (!clients) return [];

    // Fetch related data for all clients
    const clientIds = clients.map(c => c.id);

    const [programsRes, cardsRes, movementsRes, economyRes] = await Promise.all([
        supabase.from('programs').select('*').in('client_id', clientIds),
        supabase.from('cards').select('*').in('client_id', clientIds),
        supabase.from('movements').select('*').in('client_id', clientIds).order('date', { ascending: false }),
        supabase.from('economy_history').select('*').in('client_id', clientIds)
    ]);

    return clients.map(client => {
        const programs = programsRes.data?.filter(p => p.client_id === client.id) || [];
        const cards = cardsRes.data?.filter(c => c.client_id === client.id) || [];
        const movements = movementsRes.data?.filter(m => m.client_id === client.id) || [];
        const economyHistory = economyRes.data?.filter(e => e.client_id === client.id) || [];
        return dbToClient(client, programs, cards, movements, economyHistory);
    });
}

// GET single client by ID
export async function getClient(id: string): Promise<Client> {
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(`Failed to fetch client: ${error.message}`);

    const [programsRes, cardsRes, movementsRes, economyRes] = await Promise.all([
        supabase.from('programs').select('*').eq('client_id', id),
        supabase.from('cards').select('*').eq('client_id', id),
        supabase.from('movements').select('*').eq('client_id', id).order('date', { ascending: false }),
        supabase.from('economy_history').select('*').eq('client_id', id)
    ]);

    return dbToClient(
        client,
        programsRes.data || [],
        cardsRes.data || [],
        movementsRes.data || [],
        economyRes.data || []
    );
}

// POST create new client
export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    const { data: client, error } = await supabase
        .from('clients')
        .insert({
            name: clientData.name,
            email: clientData.email,
            cpf: clientData.cpf,
            birth_date: clientData.birthDate,
            gender: clientData.gender,
            marital_status: clientData.maritalStatus,
            region: clientData.region,
            profession: clientData.profession,
            start_date: clientData.startDate,
            management_fee: clientData.managementFee,
            billing_cycle: clientData.billingCycle,
            management_level: clientData.managementLevel,
            payment_method: clientData.paymentMethod,
            status: clientData.status,
            avatar: clientData.avatar,
            notes: clientData.notes,
            preferences: clientData.preferences,
            travel_notes: clientData.travelNotes
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to create client: ${error.message}`);

    // Insert related data in parallel for performance and validation
    // Insert related data in sequence (safer than parallel if connections are flaky)


    try {
        if (clientData.programs?.length) {
            const { error } = await supabase.from('programs').insert(
                clientData.programs.map(p => ({
                    client_id: client.id,
                    name: p.name,
                    balance: Math.round(Number(p.balance) || 0), // Fix 22P02: Ensure Integer
                    icon: p.icon
                }))
            );
            if (error) throw new Error(`Failed to insert programs: ${error.message}`);
        }

        if (clientData.cards?.length) {
            const { error } = await supabase.from('cards').insert(
                clientData.cards.map(c => ({
                    client_id: client.id,
                    bank: c.bank,
                    name: c.name,
                    category: c.category || 'Black'
                }))
            );
            if (error) throw new Error(`Failed to insert cards: ${error.message}`);
        }

        if (clientData.history?.length) {
            const movementsToInsert = clientData.history.map(m => ({
                client_id: client.id,
                date: m.date,
                type: m.type,
                program: m.program,
                amount: Math.round(Number(m.amount) || 0), // Fix 22P02: Ensure Integer
                description: m.description,
                observation: m.observation,
                negotiated_value: m.negotiatedValue,
                economy_generated: m.economyGenerated,
                passengers: m.passengers ? Math.round(Number(m.passengers)) : null, // Fix 22P02
                flight_class: m.flightClass,
                ticket_value: m.ticketValue,
                cpm: m.cpm,
                profit: m.profit,
                bonus_percent: m.bonusPercent !== undefined ? m.bonusPercent : null
            }));

            const { error } = await supabase.from('movements').insert(movementsToInsert);
            if (error) throw new Error(`Failed to insert history: ${error.message}`);
        }
    } catch (insertError: any) {
        console.error('Critical Error in createClient related data:', insertError);
        // Clean up partial data
        await supabase.from('clients').delete().eq('id', client.id);
        throw new Error(`Transaction Failed: ${insertError.message}. Client creation rolled back.`);
    }

    return getClient(client.id);
}

// PUT update client
export async function updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
    const updateData: any = {};

    if (clientData.name !== undefined) updateData.name = clientData.name;
    if (clientData.email !== undefined) updateData.email = clientData.email;
    if (clientData.cpf !== undefined) updateData.cpf = clientData.cpf;
    if (clientData.birthDate !== undefined) updateData.birth_date = clientData.birthDate;
    if (clientData.gender !== undefined) updateData.gender = clientData.gender;
    if (clientData.maritalStatus !== undefined) updateData.marital_status = clientData.maritalStatus;
    if (clientData.region !== undefined) updateData.region = clientData.region;
    if (clientData.profession !== undefined) updateData.profession = clientData.profession;
    if (clientData.startDate !== undefined) updateData.start_date = clientData.startDate;
    if (clientData.managementFee !== undefined) updateData.management_fee = clientData.managementFee;
    if (clientData.billingCycle !== undefined) updateData.billing_cycle = clientData.billingCycle;
    if (clientData.managementLevel !== undefined) updateData.management_level = clientData.managementLevel;
    if (clientData.paymentMethod !== undefined) updateData.payment_method = clientData.paymentMethod;
    if (clientData.status !== undefined) updateData.status = clientData.status;
    if (clientData.avatar !== undefined) updateData.avatar = clientData.avatar;
    if (clientData.notes !== undefined) updateData.notes = clientData.notes;
    if (clientData.preferences !== undefined) updateData.preferences = clientData.preferences;
    if (clientData.travelNotes !== undefined) updateData.travel_notes = clientData.travelNotes;

    if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', id);

        if (error) throw new Error(`Failed to update client: ${error.message}`);
    }

    // Update programs: Delete existing and re-insert (snapshot approach)
    if (clientData.programs) {
        await supabase.from('programs').delete().eq('client_id', id);
        if (clientData.programs.length > 0) {
            const programsToInsert = clientData.programs.map(p => ({
                // Omit ID to let Supabase generate new UUIDs
                client_id: id,
                name: p.name,
                balance: Math.round(Number(p.balance) || 0), // Fix 22P02
                icon: p.icon
            }));
            const { error: progError } = await supabase.from('programs').insert(programsToInsert);
            if (progError) console.error('Error syncing programs:', progError);
        }
    }

    // Update cards
    if (clientData.cards) {
        await supabase.from('cards').delete().eq('client_id', id);
        if (clientData.cards.length > 0) {
            const cardsToInsert = clientData.cards.map(c => ({
                // Omit ID to let Supabase generate new UUIDs
                client_id: id,
                bank: c.bank,
                name: c.name,
                category: c.category
            }));
            const { error: cardError } = await supabase.from('cards').insert(cardsToInsert);
            if (cardError) console.error('Error syncing cards:', cardError);
        }
    }

    // Sync History/Movements
    // We only insert NEW movements (temp IDs starting with known prefixes). 
    // Existing movements (UUIDs) are considered immutable logs and are ignored here.
    if (clientData.history && clientData.history.length > 0) {
        // Fix: Allow TRF-, SALE-, RES-, BONUS- prefixes as well
        const newMovements = clientData.history.filter(h =>
            h.id.startsWith('H-') ||
            h.id.startsWith('TRF-') ||
            h.id.startsWith('SALE-') ||
            h.id.startsWith('RES-') ||
            h.id.startsWith('RED-') ||
            h.id.startsWith('CONC-') ||
            h.id.startsWith('BONUS-')
        );

        if (newMovements.length > 0) {
            const movementsToInsert = newMovements.map(m => ({
                client_id: id,
                date: m.date,
                type: m.type,
                program: m.program,
                amount: Math.round(Number(m.amount) || 0), // Fix 22P02
                description: m.description,
                observation: m.observation,
                negotiated_value: m.negotiatedValue,
                economy_generated: m.economyGenerated,
                passengers: m.passengers ? Math.round(Number(m.passengers)) : null, // Fix 22P02
                flight_class: m.flightClass,
                ticket_value: m.ticketValue,
                cpm: m.cpm,
                profit: m.profit,
                bonus_percent: m.bonusPercent !== undefined ? m.bonusPercent : null
            }));

            const { error: movError } = await supabase.from('movements').insert(movementsToInsert);
            if (movError) console.error('Error syncing movements:', movError);
        }
    }

    return getClient(id);
}

// DELETE client
export async function deleteClient(id: string): Promise<Client> {
    const client = await getClient(id);

    // Delete related data first
    await Promise.all([
        supabase.from('programs').delete().eq('client_id', id),
        supabase.from('cards').delete().eq('client_id', id),
        supabase.from('movements').delete().eq('client_id', id),
        supabase.from('economy_history').delete().eq('client_id', id)
    ]);

    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete client: ${error.message}`);

    return client;
}

// Add movement to client history
export async function addMovement(clientId: string, movement: Omit<Client['history'][0], 'id'>): Promise<void> {
    const { error } = await supabase
        .from('movements')
        .insert({
            client_id: clientId,
            date: movement.date,
            type: movement.type,
            program: movement.program,
            amount: Math.round(Number(movement.amount) || 0), // Fix 22P02
            description: movement.description,
            observation: movement.observation,
            negotiated_value: movement.negotiatedValue,
            economy_generated: movement.economyGenerated,
            passengers: movement.passengers ? Math.round(Number(movement.passengers)) : null, // Fix 22P02
            flight_class: movement.flightClass,
            ticket_value: movement.ticketValue,
            cpm: movement.cpm,
            profit: movement.profit,
            bonus_percent: movement.bonusPercent
        });


    if (error) throw new Error(`Failed to add movement: ${error.message}`);
}

// Update program balance
export async function updateProgramBalance(programId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
        .from('programs')
        .update({ balance: newBalance })
        .eq('id', programId);

    if (error) throw new Error(`Failed to update program balance: ${error.message}`);
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

// Subscribe to clients changes
export function subscribeToClients(callback: (payload: any) => void) {
    const subscription = supabase
        .channel('clients-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'clients' },
            (payload) => callback(payload)
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

// Subscribe to programs changes
export function subscribeToPrograms(callback: (payload: any) => void) {
    const subscription = supabase
        .channel('programs-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'programs' },
            (payload) => callback(payload)
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

// Subscribe to movements changes for a specific client
export function subscribeToMovements(clientId: string, callback: (payload: any) => void) {
    const subscription = supabase
        .channel(`movements-${clientId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'movements',
                filter: `client_id=eq.${clientId}`
            },
            (payload) => callback(payload)
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

// Subscribe to all movements
export function subscribeToAllMovements(callback: (payload: any) => void) {
    const subscription = supabase
        .channel('all-movements')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'movements' },
            (payload) => callback(payload)
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
// DELETE movement
export async function deleteMovement(id: string): Promise<void> {
    const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Failed to delete movement: ${error.message}`);
}
