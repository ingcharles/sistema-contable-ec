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
    id: 'u1',
    nombre: 'Carlos Contador',
    email: 'admin@ecucontable.com',
    rol: 'CONTADOR'
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
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        // Simulación de API request
        await new Promise(resolve => setTimeout(resolve, 800));

        if (email === 'admin@ecucontable.com' && password === 'admin') {
            const userToSave = { ...MOCK_USER, email };
            setUser(userToSave);
            localStorage.setItem('ecu_user', JSON.stringify(userToSave));
            localStorage.setItem('current_usuario_id', userToSave.id);
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
