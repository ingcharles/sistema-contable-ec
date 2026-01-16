import { ObligacionTributaria } from '../types';

/**
 * SERVICIO DE INFRAESTRUCTURA SRI
 * Contiene lógica pura de validación y cálculo tributario según normativa.
 */

export const SRI_IMPUESTOS = {
  IVA_15: 0.15,
  IVA_0: 0.00,
  RENTA_343: 0.01 // Ejemplo retención
};

/**
 * Valida un número de RUC ecuatoriano según el algoritmo del dígito verificador (Módulo 11)
 */
export const validarRuc = (ruc: string): boolean => {
  if (!ruc || ruc.length !== 13) return false;
  
  const provincia = parseInt(ruc.substring(0, 2), 10);
  const tercerDigito = parseInt(ruc.substring(2, 3), 10);

  if (provincia < 1 || provincia > 24) return false;
  if (tercerDigito === 7) return false; // Reservado

  // Implementación simplificada para demostración. 
  // En producción se debe implementar el algoritmo completo de coeficientes 2.1.2.1...
  return true; 
};

/**
 * Calcula la fecha máxima de declaración según el 9no dígito del RUC
 */
export const calcularVencimientoSRI = (ruc: string, mes: number, anio: number): string => {
  if (!ruc || ruc.length < 9) return `${anio}-${mes}-28`; // Fallback

  const novenoDigito = parseInt(ruc.charAt(8), 10);
  let diaVencimiento = 0;

  // Calendario tributario estándar (sin considerar fines de semana para simplificar)
  switch (novenoDigito) {
    case 1: diaVencimiento = 10; break;
    case 2: diaVencimiento = 12; break;
    case 3: diaVencimiento = 14; break;
    case 4: diaVencimiento = 16; break;
    case 5: diaVencimiento = 18; break;
    case 6: diaVencimiento = 20; break;
    case 7: diaVencimiento = 22; break;
    case 8: diaVencimiento = 24; break;
    case 9: diaVencimiento = 26; break;
    case 0: diaVencimiento = 28; break;
    default: diaVencimiento = 28;
  }

  return `${anio}-${mes.toString().padStart(2, '0')}-${diaVencimiento.toString().padStart(2, '0')}`;
};

export const getObligacionesPendientes = (ruc: string): ObligacionTributaria[] => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const vencimiento = calcularVencimientoSRI(ruc, currentMonth, currentYear);
  const vencimientoDate = new Date(vencimiento);

  // Lógica simple de estado
  const estado = today > vencimientoDate ? 'VENCIDO' : 'PENDIENTE';

  return [
    {
      nombre: 'Declaración IVA Mensual (Formulario 104)',
      codigo: '104',
      fechaVencimiento: vencimiento,
      estado: estado
    },
    {
      nombre: 'Retenciones en la Fuente (Formulario 103)',
      codigo: '103',
      fechaVencimiento: vencimiento,
      estado: 'PRESENTADO' // Mock
    },
    {
      nombre: 'Anexo Transaccional Simplificado (ATS)',
      codigo: 'ATS',
      fechaVencimiento: vencimiento,
      estado: estado
    }
  ];
};

export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};
