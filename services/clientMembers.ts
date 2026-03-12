import { supabase } from './supabase';
import { ClientMember, MileageProgram, CreditCard, MileageMovement } from '../types';

// ============================================================
// CLIENT MEMBERS SERVICE
// CRUD para membros familiares dentro de um cliente
// ============================================================

export interface DbClientMember {
    id: string;
    client_id: string;
    organization_id: string;
    name: string;
    cpf?: string;
    birth_date?: string;
    relationship: string;
    programs: MileageProgram[];
    cards: CreditCard[];
    history: MileageMovement[];
    notes: string;
    created_at?: string;
    updated_at?: string;
}

function dbToClientMember(db: DbClientMember): ClientMember {
    return {
        id: db.id,
        client_id: db.client_id,
        organization_id: db.organization_id,
        name: db.name,
        cpf: db.cpf,
        birthDate: db.birth_date,
        relationship: db.relationship as ClientMember['relationship'],
        programs: db.programs || [],
        cards: db.cards || [],
        history: db.history || [],
        notes: db.notes || '',
    };
}

// Buscar organização do usuário atual
async function getCurrentOrgId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

    return data?.organization_id ?? null;
}

// Listar todos os membros de um cliente
export async function getClientMembers(clientId: string): Promise<ClientMember[]> {
    const { data, error } = await supabase
        .from('client_members')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Failed to get client members:', error);
        return [];
    }

    return (data as DbClientMember[]).map(dbToClientMember);
}

// Criar novo membro familiar
export async function createClientMember(
    clientId: string,
    data: {
        name: string;
        cpf?: string;
        birthDate?: string;
        relationship: ClientMember['relationship'];
        notes?: string;
    }
): Promise<ClientMember | null> {
    const orgId = await getCurrentOrgId();
    if (!orgId) {
        console.error('No organization found for current user');
        return null;
    }

    const { data: created, error } = await supabase
        .from('client_members')
        .insert({
            client_id: clientId,
            organization_id: orgId,
            name: data.name,
            cpf: data.cpf || null,
            birth_date: data.birthDate || null,
            relationship: data.relationship,
            programs: [],
            cards: [],
            history: [],
            notes: data.notes || '',
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create client member:', error);
        return null;
    }

    return dbToClientMember(created as DbClientMember);
}

// Atualizar dados de um membro
export async function updateClientMember(
    memberId: string,
    updates: Partial<Omit<ClientMember, 'id' | 'client_id' | 'organization_id'>>
): Promise<ClientMember | null> {
    const dbUpdates: Partial<DbClientMember> = {};

    if (updates.name !== undefined)         dbUpdates.name = updates.name;
    if (updates.cpf !== undefined)          dbUpdates.cpf = updates.cpf;
    if (updates.birthDate !== undefined)    dbUpdates.birth_date = updates.birthDate;
    if (updates.relationship !== undefined) dbUpdates.relationship = updates.relationship;
    if (updates.programs !== undefined)     dbUpdates.programs = updates.programs;
    if (updates.cards !== undefined)        dbUpdates.cards = updates.cards;
    if (updates.history !== undefined)      dbUpdates.history = updates.history;
    if (updates.notes !== undefined)        dbUpdates.notes = updates.notes;

    const { data, error } = await supabase
        .from('client_members')
        .update(dbUpdates)
        .eq('id', memberId)
        .select()
        .single();

    if (error) {
        console.error('Failed to update client member:', error);
        return null;
    }

    return dbToClientMember(data as DbClientMember);
}

// Excluir membro
export async function deleteClientMember(memberId: string): Promise<boolean> {
    const { error } = await supabase
        .from('client_members')
        .delete()
        .eq('id', memberId);

    if (error) {
        console.error('Failed to delete client member:', error);
        return false;
    }

    return true;
}
