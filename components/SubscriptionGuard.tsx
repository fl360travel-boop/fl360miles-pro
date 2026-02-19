
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

/**
 * SubscriptionGuard — bloqueia acesso quando a subscription está expirada.
 * Redireciona para /plans para que o usuário possa assinar.
 * 
 * Rotas permitidas mesmo quando bloqueado: /plans, /settings
 */
const SubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isBlocked } = useSubscription();
    const location = useLocation();

    // Rotas que sempre devem estar acessíveis (mesmo bloqueado)
    const allowedRoutes = ['/plans', '/settings'];
    const isAllowed = allowedRoutes.some(route => location.pathname.startsWith(route));

    if (isBlocked && !isAllowed) {
        return <Navigate to="/plans" replace />;
    }

    return <>{children}</>;
};

export default SubscriptionGuard;
