
import { Empresa, ComprobanteElectronico, EstadoSRI, TipoComprobante, CuentaContable } from './types';
import { LayoutDashboard, FileText, ShoppingCart, TrendingUp, Users, Settings, PieChart, Landmark, Package, Wallet, FileBarChart, Contact2, Monitor, UploadCloud, ShieldAlert, Coins } from 'lucide-react';

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

export const PLAN_CUENTAS: CuentaContable[] = [
  { codigo: '1', nombre: 'ACTIVO', nivel: 1, tipo: 'ACTIVO', saldo: 150000 },
  { codigo: '1.1', nombre: 'ACTIVO CORRIENTE', nivel: 2, tipo: 'ACTIVO', saldo: 80000 },
  { codigo: '1.1.01', nombre: 'EFECTIVO Y EQUIVALENTES', nivel: 3, tipo: 'ACTIVO', saldo: 25000 },
  { codigo: '1.1.01.01', nombre: 'CAJA GENERAL', nivel: 4, tipo: 'ACTIVO', saldo: 5000 },
  { codigo: '1.1.01.02', nombre: 'BANCOS', nivel: 4, tipo: 'ACTIVO', saldo: 20000 },
  { codigo: '1.1.01.03', nombre: 'CAJA CHICA', nivel: 4, tipo: 'ACTIVO', saldo: 500 },
  { codigo: '1.1.02', nombre: 'CUENTAS POR COBRAR', nivel: 3, tipo: 'ACTIVO', saldo: 45000 },
  { codigo: '1.1.02.01', nombre: 'CUENTAS POR COBRAR CLIENTES', nivel: 4, tipo: 'ACTIVO', saldo: 45000 },
  { codigo: '1.1.02.05', nombre: 'ANTICIPO A PROVEEDORES', nivel: 4, tipo: 'ACTIVO', saldo: 2500 },
  { codigo: '1.1.03', nombre: 'INVENTARIOS', nivel: 3, tipo: 'ACTIVO', saldo: 10000 },
  { codigo: '1.1.03.01', nombre: 'INVENTARIO DE MERCADERÍAS', nivel: 4, tipo: 'ACTIVO', saldo: 10000 },
  { codigo: '1.1.05', nombre: 'IMPUESTOS CORRIENTES ACTIVO', nivel: 3, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '1.1.05.01', nombre: 'IVA COMPRAS', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '1.1.05.02', nombre: 'RETENCIONES RENTA RECIBIDAS', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', nivel: 2, tipo: 'ACTIVO', saldo: 70000 },
  { codigo: '1.2.03', nombre: 'PROPIEDAD PLANTA Y EQUIPO', nivel: 3, tipo: 'ACTIVO', saldo: 70000 },
  { codigo: '1.2.03.99', nombre: 'DEPRECIACIÓN ACUMULADA ACTIVOS FIJOS', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '2', nombre: 'PASIVO', nivel: 1, tipo: 'PASIVO', saldo: 60000 },
  { codigo: '2.1', nombre: 'PASIVO CORRIENTE', nivel: 2, tipo: 'PASIVO', saldo: 40000 },
  { codigo: '2.1.01', nombre: 'CUENTAS POR PAGAR', nivel: 3, tipo: 'PASIVO', saldo: 35000 },
  { codigo: '2.1.01.01', nombre: 'CUENTAS POR PAGAR PROVEEDORES', nivel: 4, tipo: 'PASIVO', saldo: 35000 },
  { codigo: '2.1.01.05', nombre: 'ANTICIPO DE CLIENTES', nivel: 4, tipo: 'PASIVO', saldo: 1200 },
  { codigo: '2.1.03', nombre: 'OBLIGACIONES TRIBUTARIAS', nivel: 3, tipo: 'PASIVO', saldo: 5000 },
  { codigo: '2.1.03.01', nombre: 'RETENCIÓN RENTA POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 0 },
  { codigo: '2.1.03.02', nombre: 'RETENCIÓN IVA POR PAGAR', nivel: 4, tipo: 'PASIVO', saldo: 0 },
  { codigo: '2.1.07', nombre: 'OBLIGACIONES IVA', nivel: 3, tipo: 'PASIVO', saldo: 0 },
  { codigo: '2.1.07.01', nombre: 'IVA EN VENTAS', nivel: 4, tipo: 'PASIVO', saldo: 0 },
  { codigo: '3', nombre: 'PATRIMONIO', nivel: 1, tipo: 'PATRIMONIO', saldo: 90000 },
  { codigo: '3.1.01', nombre: 'CAPITAL SOCIAL', nivel: 3, tipo: 'PATRIMONIO', saldo: 90000 },
  { codigo: '4', nombre: 'INGRESOS', nivel: 1, tipo: 'PATRIMONIO', saldo: 0 },
  { codigo: '4.1.01', nombre: 'VENTAS', nivel: 3, tipo: 'PATRIMONIO', saldo: 0 },
  { codigo: '4.1.01.01', nombre: 'VENTAS GRAVADAS 15%', nivel: 4, tipo: 'PATRIMONIO', saldo: 0 },
  { codigo: '4.1.01.02', nombre: 'VENTAS TARIFA 0%', nivel: 4, tipo: 'PATRIMONIO', saldo: 0 },
  { codigo: '5', nombre: 'GASTOS', nivel: 1, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.1.01', nombre: 'COSTO DE VENTAS', nivel: 3, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.1.01.01', nombre: 'COSTO DE VENTAS / GASTO', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.2.02', nombre: 'GASTOS ADMINISTRATIVOS', nivel: 3, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.2.02.01', nombre: 'GASTOS SERVICIOS OCASIONALES', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.2.02.02', nombre: 'GASTOS MOVILIZACIÓN', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.2.02.03', nombre: 'GASTOS SUMINISTROS OFICINA', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
  { codigo: '5.1.03.01', nombre: 'GASTO DEPRECIACIÓN ACTIVOS FIJOS', nivel: 4, tipo: 'ACTIVO', saldo: 0 },
];

export const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
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
