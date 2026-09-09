/**
 * Obtiene el color primario de la empresa o un color por defecto si no existe
 * @param empresa - Empresa actual
 * @param defaultColor - Color por defecto (hex) si no existe el color en empresa
 * @returns Color en formato hex (#RRGGBB)
 */
export const getBrandColor = (empresa: any | null | undefined, defaultColor: string = '#64748b'): string => {
    if (!empresa) return defaultColor;
    return empresa.colorPrimario || defaultColor;
};
