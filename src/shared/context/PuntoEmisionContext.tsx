'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEmpresa } from './EmpresaContext';
import { ConfiguracionUseCases } from '@/modules/shared/application/useCases/systemUseCases';

export interface PuntoEmision {
    id: string;
    puntoEmisionId: string;
    codigoPunto: string;
    codigoEstablecimiento: string;
    nombrePunto: string;
    nombreSucursal: string;
    codigoCompleto: string; // "001-002"
    activo: boolean;
    esPrincipal: boolean;
    puedeCambiar: boolean;
}

interface PuntoEmisionContextType {
    puntoActivo: PuntoEmision | null;
    puntosDisponibles: PuntoEmision[];
    loading: boolean;
    cargarPuntosDisponibles: () => Promise<void>;
    cambiarPuntoActivo: (puntoId: string) => Promise<boolean>;
    tienePuntosAsignados: boolean;
}

const PuntoEmisionContext = createContext<PuntoEmisionContextType | undefined>(undefined);

export function PuntoEmisionProvider({ children }: { children: ReactNode }) {
    const { currentEmpresa } = useEmpresa();
    const [puntoActivo, setPuntoActivo] = useState<PuntoEmision | null>(null);
    const [puntosDisponibles, setPuntosDisponibles] = useState<PuntoEmision[]>([]);
    const [loading, setLoading] = useState(false);

    // Cargar puntos disponibles cuando cambia la empresa
    useEffect(() => {
        if (currentEmpresa?.id) {
            cargarPuntosDisponibles();
        } else {
            setPuntoActivo(null);
            setPuntosDisponibles([]);
        }
    }, [currentEmpresa?.id]);

    const cargarPuntosDisponibles = async () => {
        if (!currentEmpresa?.id) return;

        setLoading(true);
        try {
            const data = await ConfiguracionUseCases.obtenerMisPuntos();

            setPuntosDisponibles(data.puntosAsignados || []);
            setPuntoActivo(data.puntoActivo || null);

        } catch (error) {
            console.error('Error al cargar puntos:', error);
            setPuntosDisponibles([]);
            setPuntoActivo(null);
        } finally {
            setLoading(false);
        }
    };

    const cambiarPuntoActivo = async (puntoId: string): Promise<boolean> => {
        if (!currentEmpresa?.id) return false;

        setLoading(true);
        try {
            const data = await ConfiguracionUseCases.activarPuntoEmision(puntoId);

            if (data.success) {
                setPuntoActivo(data.puntoActivo);
                return true;
            }
            return false;

        } catch (error) {
            console.error('Error al cambiar punto activo:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const tienePuntosAsignados = puntosDisponibles.length > 0;

    return (
        <PuntoEmisionContext.Provider
            value={{
                puntoActivo,
                puntosDisponibles,
                loading,
                cargarPuntosDisponibles,
                cambiarPuntoActivo,
                tienePuntosAsignados
            }}
        >
            {children}
        </PuntoEmisionContext.Provider>
    );
}

export function usePuntoEmision() {
    const context = useContext(PuntoEmisionContext);
    if (context === undefined) {
        throw new Error('usePuntoEmision debe ser usado dentro de PuntoEmisionProvider');
    }
    return context;
}
