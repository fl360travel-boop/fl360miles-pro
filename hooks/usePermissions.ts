import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'owner' | 'developer' | 'demo' | null;

export function usePermissions() {
    const { userRole } = useAuth();

    return {
        // Role checks
        isOwner: userRole === 'owner',
        isDeveloper: userRole === 'developer',
        isDemo: userRole === 'demo',

        // Permission checks
        canEdit: userRole === 'owner' || userRole === 'developer',
        canDelete: userRole === 'owner',
        canViewAuditLog: userRole === 'owner',
        canExport: userRole === 'owner',
        canManageTeam: userRole === 'owner',
        canCreateClient: userRole === 'owner' || userRole === 'developer',
        canOperate: userRole === 'owner' || userRole === 'developer',
        isReadOnly: userRole === 'demo',

        // Current role
        userRole,
    };
}
