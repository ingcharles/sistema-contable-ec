'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@/shared/types';

interface AuthContextType {
    user: Usuario | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock User para simulación
const MOCK_USER: Usuario = {
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    nombre: 'Carlos Contador',
    email: 'admin@ecucontable.com',
    roles: ['CONTADOR', 'ADMIN']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sesión persistente al cargar
        const storedUser = localStorage.getItem('ecu_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            localStorage.setItem('current_usuario_id', parsedUser.id);
            fetchSubscription(parsedUser.id); // Cargar plan actualizado
        }
        setLoading(false);
    }, []);

    const fetchSubscription = async (userId: string) => {
        try {
            const res = await fetch('/api/users/me/subscription', {
                headers: { 'x-usuario-id': userId }
            });
            if (res.ok) {
                const subscriptionData = await res.json();
                setUser(prev => {
                    if (!prev) return null;
                    const updatedUser = { ...prev, ...subscriptionData };
                    localStorage.setItem('ecu_user', JSON.stringify(updatedUser)); // Actualizar cache
                    return updatedUser;
                });
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulación de API request
        await new Promise(resolve => setTimeout(resolve, 800));

        if (email === 'admin@ecucontable.com' && password === 'admin') {
            const userToSave = { ...MOCK_USER, email };
            setUser(userToSave);
            localStorage.setItem('ecu_user', JSON.stringify(userToSave));
            localStorage.setItem('current_usuario_id', userToSave.id);

            // Cargar suscripción inmediatamente
            fetchSubscription(userToSave.id);

            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ecu_user');
        localStorage.removeItem('current_usuario_id');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
