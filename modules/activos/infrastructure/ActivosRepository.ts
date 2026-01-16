
import { ActivoFijo, CategoriaActivo, EstadoActivo } from '../domain/types';

const MOCK_ACTIVOS: ActivoFijo[] = [
    {
        id: 'af1',
        empresaId: '1',
        codigo: 'VEH-001',
        nombre: 'CAMIONETA HILUX CD',
        descripcion: 'Camioneta doble cabina para reparto',
        categoria: CategoriaActivo.VEHICULOS,
        fechaAdquisicion: '2022-01-15',
        proveedor: 'TOYOTA DEL ECUADOR',
        facturaCompra: '001-001-987654',
        costoAdquisicion: 35000.00,
        valorResidual: 5000.00,
        vidaUtilAnios: 5,
        depreciacionAcumulada: 10500.00, // Aprox 21 meses
        depreciacionMensual: 500.00, // (35000-5000) / 60
        fechaUltimaDepreciacion: '2023-09-30',
        custodio: 'Juan Pérez (Chofer)',
        ubicacion: 'Matriz - Parqueadero',
        estado: EstadoActivo.ACTIVO,
        valorLibros: 24500.00,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'af2',
        empresaId: '1',
        codigo: 'TIC-005',
        nombre: 'LAPTOP DELL XPS 15',
        descripcion: 'Equipo para gerencia general',
        categoria: CategoriaActivo.EQUIPO_COMPUTO,
        fechaAdquisicion: '2023-05-10',
        proveedor: 'TECNOLOGIA GLOBAL',
        facturaCompra: '002-001-12345',
        costoAdquisicion: 2200.00,
        valorResidual: 0,
        vidaUtilAnios: 3,
        depreciacionAcumulada: 305.55, 
        depreciacionMensual: 61.11, // 2200 / 36
        fechaUltimaDepreciacion: '2023-09-30',
        custodio: 'Gerente General',
        ubicacion: 'Oficina Gerencia',
        estado: EstadoActivo.ACTIVO,
        valorLibros: 1894.45,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryActivosRepository {
    async getAll(empresaId: string): Promise<ActivoFijo[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_ACTIVOS.filter(a => a.empresaId === empresaId);
    }

    async save(activo: ActivoFijo): Promise<void> {
        MOCK_ACTIVOS.push(activo);
    }

    async actualizarDepreciacion(id: string, montoDepreciado: number): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100));
        const activo = MOCK_ACTIVOS.find(a => a.id === id);
        if (activo) {
            activo.depreciacionAcumulada += montoDepreciado;
            activo.valorLibros = activo.costoAdquisicion - activo.depreciacionAcumulada;
            activo.fechaUltimaDepreciacion = new Date().toISOString().split('T')[0];
        }
    }
}
