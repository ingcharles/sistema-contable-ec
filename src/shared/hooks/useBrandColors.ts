'use client';

import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useMemo } from 'react';

/**
 * Interface para los colores de marca de la empresa
 */
export interface BrandColors {
    primary: string;
    secondary: string;
    accent: string;
}

/**
 * Hook para obtener los colores de marca de la empresa actual
 * 
 * @returns {BrandColors} Objeto con los colores primario, secundario y de acento
 * 
 * Si la empresa no tiene colores configurados, retorna colores slate por defecto:
 * - primary: #0f172a (slate-900)
 * - secondary: #475569 (slate-600)
 * - accent: #334155 (slate-700)
 * 
 * @example
 * ```tsx
 * const colors = useBrandColors();
 * 
 * <div style={{ borderColor: colors.primary }}>
 *   <h1 style={{ backgroundColor: colors.primary }}>FACTURA</h1>
 * </div>
 * ```
 */
export function useBrandColors(): BrandColors {
    const { currentEmpresa } = useEmpresa();

    return useMemo(() => ({
        primary: currentEmpresa?.colorPrimario || '#0f172a',    // slate-900 default
        secondary: currentEmpresa?.colorSecundario || '#475569', // slate-600 default
        accent: currentEmpresa?.colorAcento || '#334155'         // slate-700 default
    }), [currentEmpresa?.colorPrimario, currentEmpresa?.colorSecundario, currentEmpresa?.colorAcento]);
}
