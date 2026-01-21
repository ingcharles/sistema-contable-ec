import { Empresa, ComprobanteElectronico, EstadoSRI, TipoComprobante } from './types';
import {
    LayoutDashboard, FileText, ShoppingCart, TrendingUp, Users, Settings,
    PieChart, Landmark, Package, Wallet, FileBarChart, Contact2, Monitor,
    UploadCloud, ShieldAlert, Coins, LucideIcon
} from 'lucide-react';

export interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
}

export const MOCK_EMPRESAS: Empresa[] = [
    {
        id: '1',
        razonSocial: 'COMERCIAL ECUADOR S.A.',
        nombreComercial: 'COMERCIAL ECUADOR',
        ruc: '1790011223001',
        direccionMatriz: 'Av. Amazonas y Naciones Unidas, Quito',
        obligadoContabilidad: true,
        agenteRetencion: true,
        contribuyenteEspecial: '5368',
        rimpe: null,
        logoUrl: 'https://picsum.photos/40/40'
    },
    {
        id: '2',
        razonSocial: 'SERVICIOS TECNOLÓGICOS DEL SUR C.A.',
        nombreComercial: 'SERVICIOS DEL SUR',
        ruc: '0992233445001',
        direccionMatriz: 'Av. 9 de Octubre, Guayaquil',
        obligadoContabilidad: true,
        agenteRetencion: false,
        contribuyenteEspecial: null,
        rimpe: 'EMPRENDEDOR',
        logoUrl: 'https://picsum.photos/41/41'
    }
];

export const MOCK_FACTURAS: ComprobanteElectronico[] = [
    {
        id: 'f1',
        tipo: TipoComprobante.FACTURA,
        secuencial: '001-002-000004521',
        fechaEmision: '2023-10-25',
        terceroNombre: 'SUPERMAXI S.A.',
        terceroId: '1790016919001',
        totalSinImpuestos: 1500.00,
        totalImpuestos: 180.00,
        importeTotal: 1680.00,
        estado: EstadoSRI.AUTORIZADO,
        claveAcceso: '2510202301179001691900120010020000045211234567819'
    },
    {
        id: 'f2',
        tipo: TipoComprobante.RETENCION,
        secuencial: '001-002-000000123',
        fechaEmision: '2023-10-26',
        terceroNombre: 'JUAN PEREZ CONSULTING',
        terceroId: '1712345678001',
        totalSinImpuestos: 500.00,
        totalImpuestos: 0,
        importeTotal: 500.00,
        estado: EstadoSRI.PENDIENTE,
        claveAcceso: '2610202307171234567800120010020000001231234567811'
    },
    {
        id: 'f3',
        tipo: TipoComprobante.FACTURA,
        secuencial: '001-010-000009988',
        fechaEmision: '2023-10-27',
        terceroNombre: 'IMPORTADORA ANDINA',
        terceroId: '0990004445001',
        totalSinImpuestos: 3200.50,
        totalImpuestos: 384.06,
        importeTotal: 3584.56,
        estado: EstadoSRI.ANULADO,
        claveAcceso: '2710202301099000444500120010100000099881234567812'
    }
];

export const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Facturación', icon: FileText, path: '/facturacion' },
    { label: 'Compras', icon: ShoppingCart, path: '/compras' },
    { label: 'Buzón XML', icon: UploadCloud, path: '/buzon' },
    { label: 'Terceros', icon: Contact2, path: '/directorio' },
    { label: 'Cartera', icon: Wallet, path: '/cartera' },
    { label: 'Inventario', icon: Package, path: '/inventario' },
    { label: 'Activos Fijos', icon: Monitor, path: '/activos' },
    { label: 'Caja Chica', icon: Coins, path: '/caja-chica' },
    { label: 'Bancos', icon: Landmark, path: '/bancos' },
    { label: 'Contabilidad', icon: TrendingUp, path: '/contabilidad' },
    { label: 'Impuestos', icon: PieChart, path: '/impuestos' },
    { label: 'Nómina', icon: Users, path: '/nomina' },
    { label: 'Reportes', icon: FileBarChart, path: '/reportes' },
    { label: 'Auditoría', icon: ShieldAlert, path: '/auditoria' },
    { label: 'Configuración', icon: Settings, path: '/configuracion' },
];
