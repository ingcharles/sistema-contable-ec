/**
 * Casos de Uso para el módulo de Bancos
 */
export const BancosUseCases = {
    async listarCuentas() {
        const res = await fetch('/api/bancos/cuentas');
        return await res.json();
    },
    async registrarMovimiento(movimiento: any) {
        const res = await fetch('/api/bancos/movimientos', {
            method: 'POST',
            body: JSON.stringify(movimiento)
        });
        return await res.json();
    }
};

/**
 * Casos de Uso para el módulo de Nómina
 */
export const NominaUseCases = {
    async listarEmpleados() {
        const res = await fetch('/api/nomina/empleados');
        return await res.json();
    },
    async generarRol(periodo: string) {
        const res = await fetch('/api/nomina/roles/generar', {
            method: 'POST',
            body: JSON.stringify({ periodo })
        });
        return await res.json();
    }
};
