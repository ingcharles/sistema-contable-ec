import { LogAuditoria, AuditoriaRepository, TipoEvento, NivelSeveridad } from '../domain/types';

const MOCK_LOGS: LogAuditoria[] = [
    // FACTURACION
    { id: '1', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.AUTORIZACION_SRI, modulo: 'FACTURACION', descripcion: 'Factura 001-001-000000123 autorizada con éxito', ip: '192.168.1.45', severidad: NivelSeveridad.INFO, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
    { id: '2', empresaId: '1', usuario: 'ventas@empresa.com', evento: TipoEvento.CREACION, modulo: 'FACTURACION', descripcion: 'Nueva factura creada: 001-001-000000124', ip: '192.168.1.50', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'ventas' },
    { id: '3', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.ANULACION, modulo: 'FACTURACION', descripcion: 'Factura 001-001-000000120 anulada por error en datos', ip: '192.168.1.45', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' },

    // COMPRAS
    { id: '4', empresaId: '1', usuario: 'compras@empresa.com', evento: TipoEvento.CREACION, modulo: 'COMPRAS', descripcion: 'Orden de compra OC-2024-001 creada', ip: '192.168.1.55', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 5400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'compras' },
    { id: '5', empresaId: '1', usuario: 'compras@empresa.com', evento: TipoEvento.MODIFICACION, modulo: 'COMPRAS', descripcion: 'Liquidación de compra LC-001-001-0045 modificada', ip: '192.168.1.55', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'compras' },

    // INVENTARIO
    { id: '6', empresaId: '1', usuario: 'carlos.paz@empresa.com', evento: TipoEvento.MODIFICACION, modulo: 'INVENTARIO', descripcion: 'Cambio de precio en producto: MacBook Pro M3', ip: '186.4.12.90', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 9000000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'carlos.paz' },
    { id: '7', empresaId: '1', usuario: 'bodega@empresa.com', evento: TipoEvento.CREACION, modulo: 'INVENTARIO', descripcion: 'Nuevo producto agregado: Mouse Logitech MX Master 3', ip: '192.168.1.60', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 10800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'bodega' },
    { id: '8', empresaId: '1', usuario: 'bodega@empresa.com', evento: TipoEvento.ELIMINACION, modulo: 'INVENTARIO', descripcion: 'Producto eliminado: Cable HDMI 2m (descontinuado)', ip: '192.168.1.60', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 12600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'bodega' },

    // BANCOS
    { id: '9', empresaId: '1', usuario: 'sistema', evento: TipoEvento.ERROR, modulo: 'BANCOS', descripcion: 'Fallo en conexión con API de Banco Pichincha para conciliación', ip: '127.0.0.1', severidad: NivelSeveridad.CRITICAL, createdAt: new Date(Date.now() - 14400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
    { id: '10', empresaId: '1', usuario: 'tesoreria@empresa.com', evento: TipoEvento.CREACION, modulo: 'BANCOS', descripcion: 'Transferencia bancaria registrada: $5,420.00 a Proveedor XYZ', ip: '192.168.1.70', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 16200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'tesoreria' },
    { id: '11', empresaId: '1', usuario: 'tesoreria@empresa.com', evento: TipoEvento.CONCILIACION, modulo: 'BANCOS', descripcion: 'Conciliación bancaria completada para Banco Guayaquil - Enero 2024', ip: '192.168.1.70', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 18000000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'tesoreria' },

    // CONTABILIDAD
    { id: '12', empresaId: '1', usuario: 'contador@empresa.com', evento: TipoEvento.CREACION, modulo: 'CONTABILIDAD', descripcion: 'Asiento contable AS-2024-0156 creado', ip: '192.168.1.75', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 19800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'contador' },
    { id: '13', empresaId: '1', usuario: 'contador@empresa.com', evento: TipoEvento.MAYORIZACION, modulo: 'CONTABILIDAD', descripcion: 'Asiento AS-2024-0156 mayorizado exitosamente', ip: '192.168.1.75', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 21600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'contador' },
    { id: '14', empresaId: '1', usuario: 'contador@empresa.com', evento: TipoEvento.MODIFICACION, modulo: 'CONTABILIDAD', descripcion: 'Centro de costos "Proyecto Alpha" actualizado', ip: '192.168.1.75', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 23400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'contador' },

    // CARTERA
    { id: '15', empresaId: '1', usuario: 'cobranzas@empresa.com', evento: TipoEvento.CREACION, modulo: 'CARTERA', descripcion: 'Anticipo de cliente registrado: $1,200.00', ip: '192.168.1.80', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 25200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'cobranzas' },
    { id: '16', empresaId: '1', usuario: 'cobranzas@empresa.com', evento: TipoEvento.CRUCE_CUENTAS, modulo: 'CARTERA', descripcion: 'Cruce de cuentas: Anticipo aplicado a Factura 001-001-000000115', ip: '192.168.1.80', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 27000000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'cobranzas' },
    { id: '17', empresaId: '1', usuario: 'cobranzas@empresa.com', evento: TipoEvento.PAGO, modulo: 'CARTERA', descripcion: 'Pago recibido: $3,450.00 de Cliente ABC S.A.', ip: '192.168.1.80', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 28800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'cobranzas' },

    // NOMINA
    { id: '18', empresaId: '1', usuario: 'rrhh@empresa.com', evento: TipoEvento.CREACION, modulo: 'NOMINA', descripcion: 'Rol de pagos Enero 2024 generado', ip: '192.168.1.85', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 30600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'rrhh' },
    { id: '19', empresaId: '1', usuario: 'rrhh@empresa.com', evento: TipoEvento.MODIFICACION, modulo: 'NOMINA', descripcion: 'Horas extras actualizadas para empleado: Juan Pérez', ip: '192.168.1.85', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 32400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'rrhh' },

    // AUDITORIA
    { id: '20', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.ACCESO, modulo: 'AUDITORIA', descripcion: 'Acceso al módulo de auditoría', ip: '192.168.1.45', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 34200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' },
    { id: '21', empresaId: '1', usuario: 'auditor@empresa.com', evento: TipoEvento.EXPORTACION, modulo: 'AUDITORIA', descripcion: 'Exportación de logs de auditoría - Periodo: Enero 2024', ip: '192.168.1.90', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 36000000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'auditor' },

    // SISTEMA
    { id: '22', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.LOGIN, modulo: 'SISTEMA', descripcion: 'Inicio de sesión exitoso', ip: '192.168.1.45', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 37800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' },
    { id: '23', empresaId: '1', usuario: 'usuario.invalido@test.com', evento: TipoEvento.LOGIN_FALLIDO, modulo: 'SISTEMA', descripcion: 'Intento de inicio de sesión fallido - Contraseña incorrecta', ip: '186.5.23.100', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 39600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
    { id: '24', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.CONFIGURACION, modulo: 'SISTEMA', descripcion: 'Configuración de parámetros contables actualizada', ip: '192.168.1.45', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 41400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' },
    { id: '25', empresaId: '1', usuario: 'sistema', evento: TipoEvento.ERROR, modulo: 'SISTEMA', descripcion: 'Error en proceso de respaldo automático', ip: '127.0.0.1', severidad: NivelSeveridad.CRITICAL, createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system' },
    { id: '26', empresaId: '1', usuario: 'admin@ecucontable.pro', evento: TipoEvento.BACKUP, modulo: 'SISTEMA', descripcion: 'Respaldo manual de base de datos completado', ip: '192.168.1.45', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 45000000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin' },

    // Más eventos variados
    { id: '27', empresaId: '1', usuario: 'ventas@empresa.com', evento: TipoEvento.CREACION, modulo: 'FACTURACION', descripcion: 'Nota de crédito NC-001-001-00012 emitida', ip: '192.168.1.50', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 46800000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'ventas' },
    { id: '28', empresaId: '1', usuario: 'compras@empresa.com', evento: TipoEvento.PAGO, modulo: 'COMPRAS', descripcion: 'Pago a proveedor registrado: $8,750.00', ip: '192.168.1.55', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 48600000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'compras' },
    { id: '29', empresaId: '1', usuario: 'bodega@empresa.com', evento: TipoEvento.AJUSTE_INVENTARIO, modulo: 'INVENTARIO', descripcion: 'Ajuste de inventario por diferencia física: -5 unidades Producto SKU-1234', ip: '192.168.1.60', severidad: NivelSeveridad.WARNING, createdAt: new Date(Date.now() - 50400000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'bodega' },
    { id: '30', empresaId: '1', usuario: 'contador@empresa.com', evento: TipoEvento.CIERRE_PERIODO, modulo: 'CONTABILIDAD', descripcion: 'Cierre contable del mes de Diciembre 2023 completado', ip: '192.168.1.75', severidad: NivelSeveridad.INFO, createdAt: new Date(Date.now() - 52200000).toISOString(), updatedAt: new Date().toISOString(), createdBy: 'contador' },
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
