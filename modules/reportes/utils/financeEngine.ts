
import { CuentaContable } from '../../../types';
import { AsientoContable } from '../../contabilidad/domain/types';

export interface LineaReporteFinanciero {
    codigo: string;
    nombre: string;
    nivel: number;
    tipo: string;
    saldoAnterior: number;
    debePeriodo: number;
    haberPeriodo: number;
    saldoFinal: number;
    hijos: LineaReporteFinanciero[];
}

/**
 * Motor de Cálculo Financiero
 * Transforma una lista plana de cuentas y asientos en un árbol jerárquico con saldos acumulados.
 */
export const generarArbolFinanciero = (
    planCuentas: CuentaContable[], 
    asientos: AsientoContable[], 
    fechaInicio: string, 
    fechaFin: string
): LineaReporteFinanciero[] => {
    
    // 1. Inicializar mapa de saldos
    const mapaMovimientos = new Map<string, { debe: number, haber: number }>();

    // 2. Procesar Asientos (Mayorización)
    asientos.forEach(asiento => {
        if (asiento.estado !== 'MAYORIZADO') return;
        
        // Filtro de fecha para movimientos del periodo
        const enPeriodo = asiento.fecha >= fechaInicio && asiento.fecha <= fechaFin;
        
        // TODO: En un sistema real, los saldos anteriores se calculan sumando todo lo previo a fechaInicio
        // Aquí simplificamos asumiendo que el 'saldo' en PLAN_CUENTAS es el inicial o acumulado.
        
        if (enPeriodo) {
            asiento.detalles.forEach(detalle => {
                const actual = mapaMovimientos.get(detalle.cuentaCodigo) || { debe: 0, haber: 0 };
                mapaMovimientos.set(detalle.cuentaCodigo, {
                    debe: actual.debe + detalle.debe,
                    haber: actual.haber + detalle.haber
                });
            });
        }
    });

    // 3. Convertir Plan de Cuentas a estructura de árbol
    // Primero, creamos objetos extendidos para todas las cuentas
    const todasLasLineas: LineaReporteFinanciero[] = planCuentas.map(cuenta => {
        const movs = mapaMovimientos.get(cuenta.codigo) || { debe: 0, haber: 0 };
        
        // El saldo base viene del mock PLAN_CUENTAS (que actúa como saldo inicial/acumulado para este demo)
        const saldoBase = cuenta.saldo; 
        
        // Calculo de saldo final basado en naturaleza
        let saldoFinal = saldoBase;
        const esDeudora = ['ACTIVO', 'GASTOS', 'COSTOS'].some(t => cuenta.tipo.toUpperCase().includes(t));
        
        if (esDeudora) {
            saldoFinal = saldoBase + movs.debe - movs.haber;
        } else {
            saldoFinal = saldoBase + movs.haber - movs.debe;
        }

        return {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            nivel: cuenta.nivel,
            tipo: cuenta.tipo,
            saldoAnterior: saldoBase, // Simplificación
            debePeriodo: movs.debe,
            haberPeriodo: movs.haber,
            saldoFinal: saldoFinal,
            hijos: []
        };
    });

    // 4. Construir jerarquía (Roll-up)
    // Ordenamos por nivel descendente (4 -> 3 -> 2 -> 1) para acumular saldos de hijos a padres
    const lineasOrdenadas = [...todasLasLineas].sort((a, b) => b.nivel - a.nivel);
    const mapaLineas = new Map<string, LineaReporteFinanciero>();
    
    lineasOrdenadas.forEach(linea => mapaLineas.set(linea.codigo, linea));

    lineasOrdenadas.forEach(linea => {
        // Buscar padre (Ej: si soy 1.1.01, mi padre es 1.1)
        if (linea.nivel > 1) {
            // Lógica simple de búsqueda de padre por prefijo
            // Buscamos la cuenta que tenga el código más largo que sea prefijo de la actual
            const parentCode = buscarCodigoPadre(linea.codigo);
            const padre = mapaLineas.get(parentCode);
            
            if (padre) {
                padre.hijos.push(linea);
                // ACUMULAR SALDOS AL PADRE
                // Nota: En contabilidad, las cuentas padre NO tienen movimientos directos, solo la suma de sus hijos.
                // Si el mock PLAN_CUENTAS tiene saldos en padres, los sobrescribimos con la suma de hijos para consistencia
                if (padre.hijos.length === 1) { // Primera vez que sumamos hijos, reseteamos el saldo del padre para recalcular
                     padre.saldoFinal = 0;
                     padre.saldoAnterior = 0;
                     padre.debePeriodo = 0;
                     padre.haberPeriodo = 0;
                }
                
                padre.saldoFinal += linea.saldoFinal;
                padre.saldoAnterior += linea.saldoAnterior;
                padre.debePeriodo += linea.debePeriodo;
                padre.haberPeriodo += linea.haberPeriodo;
                
                // Reordenar hijos por código para visualización correcta
                padre.hijos.sort((a, b) => a.codigo.localeCompare(b.codigo));
            }
        }
    });

    // 5. Retornar solo las raíces (Nivel 1)
    return Array.from(mapaLineas.values())
        .filter(l => l.nivel === 1)
        .sort((a, b) => a.codigo.localeCompare(b.codigo));
};

const buscarCodigoPadre = (codigo: string): string => {
    if (codigo.includes('.')) {
        return codigo.substring(0, codigo.lastIndexOf('.'));
    }
    return '';
};
