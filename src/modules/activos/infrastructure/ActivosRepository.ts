import { ActivoFijo, ActivosRepository, CategoriaActivo, EstadoActivo } from '../domain/types';

const MOCK_ACTIVOS: ActivoFijo[] = [
    {
        id: '1',
        empresaId: '1',
        codigo: 'ACT-001',
        nombre: 'MacBook Pro M3 Max',
        categoria: CategoriaActivo.EQUIPO_COMPUTACION,
        fechaAdquisicion: '2024-01-15',
        valorAdquisicion: 3500.00,
        valorResidual: 350.00,
        vidaUtilMeses: 36,
        depreciacionAcumulada: 583.33,
        valorLibros: 2916.67,
        estado: EstadoActivo.OPERATIVO,
        ubicacion: 'Oficina Central - IT',
        responsable: 'Carlos Pazmiño',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
    },
    {
        id: '2',
        empresaId: '1',
        codigo: 'ACT-002',
        nombre: 'Escritorio Ergonómico Pro',
        categoria: CategoriaActivo.MUEBLES_ENSERES,
        fechaAdquisicion: '2023-11-10',
        valorAdquisicion: 850.00,
        valorResidual: 85.00,
        vidaUtilMeses: 120,
        depreciacionAcumulada: 42.50,
        valorLibros: 807.50,
        estado: EstadoActivo.OPERATIVO,
        ubicacion: 'Oficina Central - Gerencia',
        responsable: 'Ana Lucía',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
    }
];

export class InMemoryActivosRepository implements ActivosRepository {
    async getActivos(empresaId: string): Promise<ActivoFijo[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_ACTIVOS.filter(a => a.empresaId === empresaId);
    }

    async saveActivo(activo: ActivoFijo): Promise<void> {
        const index = MOCK_ACTIVOS.findIndex(a => a.id === activo.id);
        if (index >= 0) MOCK_ACTIVOS[index] = activo;
        else MOCK_ACTIVOS.push(activo);
    }

    async deleteActivo(id: string): Promise<void> {
        const index = MOCK_ACTIVOS.findIndex(a => a.id === id);
        if (index >= 0) MOCK_ACTIVOS.splice(index, 1);
    }

    async calcularDepreciacionMensual(_empresaId: string, _periodo: string): Promise<number> {
        return 625.83;
    }
}
