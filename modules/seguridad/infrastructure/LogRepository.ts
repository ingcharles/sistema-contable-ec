
import { LogAuditoria, ModuloSistema, TipoAccion } from '../domain/types';

const MOCK_LOGS: LogAuditoria[] = [
    {
        id: 'log1', empresaId: '1', usuarioId: 'u1', usuarioNombre: 'Carlos Contador',
        fecha: '2023-10-28T10:30:00Z', modulo: ModuloSistema.FACTURACION, accion: TipoAccion.CREAR,
        descripcion: 'Emisión de Factura 001-002-000004521', recursoId: 'f1',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'log2', empresaId: '1', usuarioId: 'u1', usuarioNombre: 'Carlos Contador',
        fecha: '2023-10-28T11:15:00Z', modulo: ModuloSistema.CONTABILIDAD, accion: TipoAccion.MODIFICAR,
        descripcion: 'Modificación de Asiento Contable CD-10-2023-001', recursoId: 'as1',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'log3', empresaId: '1', usuarioId: 'u2', usuarioNombre: 'Maria Velez',
        fecha: '2023-10-28T09:00:00Z', modulo: ModuloSistema.SEGURIDAD, accion: TipoAccion.LOGIN,
        descripcion: 'Inicio de sesión exitoso',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'log4', empresaId: '1', usuarioId: 'u1', usuarioNombre: 'Carlos Contador',
        fecha: '2023-10-27T16:45:00Z', modulo: ModuloSistema.COMPRAS, accion: TipoAccion.ANULAR,
        descripcion: 'Anulación de Retención 001-002-000000451 por error en porcentaje',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'log5', empresaId: '1', usuarioId: 'u1', usuarioNombre: 'Carlos Contador',
        fecha: '2023-10-27T14:20:00Z', modulo: ModuloSistema.NOMINA, accion: TipoAccion.APROBAR,
        descripcion: 'Aprobación de Rol de Pagos Octubre 2023',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryLogRepository {
    async getLogs(empresaId: string, filtros?: { fechaInicio?: string, fechaFin?: string, usuario?: string }): Promise<LogAuditoria[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_LOGS.filter(l => l.empresaId === empresaId).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    async saveLog(log: LogAuditoria): Promise<void> {
        MOCK_LOGS.unshift(log);
    }
}
