import { LogAuditoria, AuditoriaRepository, TipoEvento, NivelSeveridad } from '../domain/types';

const MOCK_LOGS: LogAuditoria[] = [
    {
        id: '1',
        empresaId: '1',
        usuario: 'admin@ecucontable.pro',
        evento: TipoEvento.AUTORIZACION_SRI,
        modulo: 'Facturación',
        descripcion: 'Factura 001-001-000000123 autorizada con éxito',
        ip: '192.168.1.45',
        severidad: NivelSeveridad.INFO,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system'
    },
    {
        id: '2',
        empresaId: '1',
        usuario: 'carlos.paz@empresa.com',
        evento: TipoEvento.MODIFICACION,
        modulo: 'Inventario',
        descripcion: 'Cambio de precio en producto: MacBook Pro M3',
        ip: '186.4.12.90',
        severidad: NivelSeveridad.WARNING,
        createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'carlos.paz'
    },
    {
        id: '3',
        empresaId: '1',
        usuario: 'sistema',
        evento: TipoEvento.ERROR,
        modulo: 'Bancos',
        descripcion: 'Fallo en conexión con API de Banco Pichincha para conciliación',
        ip: '127.0.0.1',
        severidad: NivelSeveridad.CRITICAL,
        createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system'
    }
];

export class InMemoryAuditoriaRepository implements AuditoriaRepository {
    async getLogs(empresaId: string, _filtros?: any): Promise<LogAuditoria[]> {
        await new Promise(resolve => setTimeout(resolve, 400));
        return MOCK_LOGS.filter(l => l.empresaId === empresaId).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async registrarLog(log: Partial<LogAuditoria>): Promise<void> {
        console.log('Registrando log de auditoría:', log);
    }
}
