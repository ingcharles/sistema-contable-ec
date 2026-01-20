'use client';

import React, { createContext, useContext, useState } from 'react';
import { Empresa } from '@/shared/types';
import { MOCK_EMPRESAS } from '@/shared/constants';

interface EmpresaContextType {
    currentEmpresa: Empresa;
    setCurrentEmpresa: (empresa: Empresa) => void;
    empresas: Empresa[];
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export const EmpresaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentEmpresa, _setCurrentEmpresa] = useState<Empresa>(MOCK_EMPRESAS[0]);

    const setCurrentEmpresa = (empresa: Empresa) => {
        _setCurrentEmpresa(empresa);
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_empresa_id', empresa.id);
        }
    };

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_empresa_id', currentEmpresa.id);
        }
    }, [currentEmpresa.id]);

    return (
        <EmpresaContext.Provider value={{
            currentEmpresa,
            setCurrentEmpresa,
            empresas: MOCK_EMPRESAS
        }}>
            {children}
        </EmpresaContext.Provider>
    );
};

export const useEmpresa = () => {
    const context = useContext(EmpresaContext);
    if (context === undefined) {
        throw new Error('useEmpresa debe ser usado dentro de un EmpresaProvider');
    }
    return context;
};
