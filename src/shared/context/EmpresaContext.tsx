'use client';

import React, { createContext, useContext, useState } from 'react';
import { Empresa } from '@/shared/types';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface EmpresaContextType {
    currentEmpresa: Empresa;
    setCurrentEmpresa: (empresa: Empresa) => void;
    empresas: Empresa[];
    refreshEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export const EmpresaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [currentEmpresa, _setCurrentEmpresa] = useState<Empresa | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshEmpresas = async () => {
        try {
            const data = await ConfiguracionUseCases.listarEmpresas();
            setEmpresas(data);

            // Si no hay empresa seleccionada, intentar cargar del localStorage o usar la primera
            if (!currentEmpresa && data.length > 0) {
                const savedId = typeof window !== 'undefined' ? localStorage.getItem('current_empresa_id') : null;
                const savedEmpresa = data.find((e: Empresa) => e.id === savedId) || data[0];
                _setCurrentEmpresa(savedEmpresa);
            }
        } catch (error) {
            console.error('Error al cargar empresas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setCurrentEmpresa = (empresa: Empresa) => {
        _setCurrentEmpresa(empresa);
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_empresa_id', empresa.id);
        }
    };

    React.useEffect(() => {
        refreshEmpresas();
    }, []);

    React.useEffect(() => {
        if (currentEmpresa && typeof window !== 'undefined') {
            localStorage.setItem('current_empresa_id', currentEmpresa.id);
        }
    }, [currentEmpresa?.id]);

    // Mostrar loader solo mientras se está cargando la primera vez
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sri-blue mx-auto mb-4"></div>
                    <p className="text-slate-600 text-sm">Cargando empresas...</p>
                </div>
            </div>
        );
    }

    // Si no hay empresas en la base de datos, renderizar la app normalmente
    // pero con una empresa temporal para permitir crear la primera
    if (empresas.length === 0) {
        // Crear una empresa temporal para que la app pueda renderizar
        const tempEmpresa: Empresa = {
            id: 'temp',
            ruc: '',
            razonSocial: 'Sin empresa',
            nombreComercial: 'Sin empresa',
            direccionMatriz: '',
            logoUrl: '',
            obligadoContabilidad: false,
            agenteRetencion: false,
            contribuyenteEspecial: null,
            rimpe: null
        };

        return (
            <EmpresaContext.Provider value={{
                currentEmpresa: tempEmpresa,
                setCurrentEmpresa,
                empresas: [],
                refreshEmpresas
            }}>
                {children}
            </EmpresaContext.Provider>
        );
    }

    return (
        <EmpresaContext.Provider value={{
            currentEmpresa: currentEmpresa!,
            setCurrentEmpresa,
            empresas,
            refreshEmpresas
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
