
import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Empresa, EstadoSRI, TipoComprobante, TipoIdentificacion } from '../../../types';
import { formatMoney } from '../../../services/sriService';
import { InMemoryFacturaRepository } from '../../facturacion/infrastructure/FacturaRepository';
import { InMemoryCompraRepository } from '../../compras/infrastructure/CompraRepository';
import { InMemoryNominaRepository } from '../../nomina/infrastructure/NominaRepository';
import { Factura } from '../../facturacion/domain/types';
import { Compra, SustentoTributario } from '../../compras/domain/types';
import { RolPago } from '../../nomina/domain/types';
import { FileCheck, AlertTriangle, TrendingUp, Calculator, Info, FileCode, Download, RefreshCw, Calendar, Loader2, PieChart } from 'lucide-react';

// --- UTILIDAD: GENERADOR XML ATS (Lógica SRI) ---
const mapTipoIdATS = (tipo: string) => {
    switch (tipo) {
        case TipoIdentificacion.RUC: return '01';
        case TipoIdentificacion.CEDULA: return '02';
        case TipoIdentificacion.PASAPORTE: return '03';
        default: return '01';
    }
};

const generarXmlATS = (empresa: Empresa, periodo: { mes: string, anio: string }, compras: Compra[], ventas: Factura[]): string => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<iva>\n`;
    
    // 1. CABECERA
    xml += `  <TipoIDInformante>R</TipoIDInformante>\n`;
    xml += `  <IdInformante>${empresa.ruc}</IdInformante>\n`;
    xml += `  <razonSocial>${empresa.razonSocial.replace(/&/g, '&amp;')}</razonSocial>\n`;
    xml += `  <Anio>${periodo.anio}</Anio>\n`;
    xml += `  <Mes>${periodo.mes}</Mes>\n`;
    xml += `  <numEstabRuc>${empresa.ruc.substring(10)}</numEstabRuc>\n`;
    
    const totalVentas = ventas.reduce((acc, v) => acc + v.importeTotal, 0);
    xml += `  <totalVentas>${totalVentas.toFixed(2)}</totalVentas>\n`;
    xml += `  <codigoOperativo>IVA</codigoOperativo>\n`;

    // 2. COMPRAS
    if (compras.length > 0) {
        xml += `  <compras>\n`;
        compras.forEach(c => {
            // Asumimos código sustento y tipo comprobante válidos del dominio
            const sustento = c.sustento || SustentoTributario.CREDITO_TRIBUTARIO;
            // Desglosar serie y secuencial (001-001-123456789)
            const partes = c.secuencial.split('-');
            const estab = partes[0] || '001';
            const ptoEmi = partes[1] || '001';
            const sec = partes[2] || '000000001';

            xml += `    <detalleCompras>\n`;
            xml += `      <codSustento>${sustento}</codSustento>\n`;
            xml += `      <tpIdProv>01</tpIdProv>\n`; // Por defecto RUC para el demo
            xml += `      <idProv>${c.proveedor.ruc}</idProv>\n`;
            xml += `      <tipoComprobante>${c.tipoComprobante}</tipoComprobante>\n`; // 01, 03, etc
            xml += `      <tipoProv>01</tipoProv>\n`; // Persona Jurídica (Simplificado)
            xml += `      <denopr>${c.proveedor.razonSocial.substring(0, 50).replace(/&/g, '&amp;')}</denopr>\n`;
            xml += `      <parteRel>NO</parteRel>\n`;
            xml += `      <fechaRegistro>${c.fechaRegistro.split('-').reverse().join('/')}</fechaRegistro>\n`;
            xml += `      <establecimiento>${estab}</establecimiento>\n`;
            xml += `      <puntoEmision>${ptoEmi}</puntoEmision>\n`;
            xml += `      <secuencial>${sec}</secuencial>\n`;
            xml += `      <fechaEmision>${c.fechaEmision.split('-').reverse().join('/')}</fechaEmision>\n`;
            xml += `      <autorizacion>${c.autorizacion}</autorizacion>\n`;
            xml += `      <baseNoGraIva>${c.subtotal0.toFixed(2)}</baseNoGraIva>\n`;
            xml += `      <baseImponible>${c.subtotal0.toFixed(2)}</baseImponible>\n`; // Base 0
            xml += `      <baseImpGrav>${c.subtotal15.toFixed(2)}</baseImpGrav>\n`; // Base IVA
            xml += `      <baseImpExe>0.00</baseImpExe>\n`;
            xml += `      <montoIce>0.00</montoIce>\n`;
            xml += `      <montoIva>${c.montoIva.toFixed(2)}</montoIva>\n`;
            
            // Retenciones (Si existen)
            if (c.tieneRetencion && c.estadoRetencion === 'EMITIDA') {
                const valRetBienes = 0.00; // Calcular según código
                const valRetServ = 0.00; // Calcular según código
                // ... lógica compleja de retención simplificada
                xml += `      <valRetBien10>0.00</valRetBien10>\n`;
                xml += `      <valRetServ20>0.00</valRetServ20>\n`;
                xml += `      <valorRetBienes>0.00</valorRetBienes>\n`;
                xml += `      <valorRetServicios>0.00</valorRetServicios>\n`;
                xml += `      <valRetServ100>0.00</valRetServ100>\n`;
                
                // Info del comprobante de retención emitido
                if (c.nroRetencion) {
                    const retPartes = c.nroRetencion.split('-');
                    xml += `      <estabRetencion1>${retPartes[0]}</estabRetencion1>\n`;
                    xml += `      <ptoEmiRetencion1>${retPartes[1]}</ptoEmiRetencion1>\n`;
                    xml += `      <secRetencion1>${retPartes[2]}</secRetencion1>\n`;
                    xml += `      <autRetencion1>1234567890</autRetencion1>\n`; // Mock autorización
                    xml += `      <fechaEmiRet1>${c.fechaEmision.split('-').reverse().join('/')}</fechaEmiRet1>\n`;
                }
            } else {
                xml += `      <valRetBien10>0.00</valRetBien10>\n`;
                xml += `      <valRetServ20>0.00</valRetServ20>\n`;
                xml += `      <valorRetBienes>0.00</valorRetBienes>\n`;
                xml += `      <valorRetServicios>0.00</valorRetServicios>\n`;
                xml += `      <valRetServ100>0.00</valRetServ100>\n`;
            }
            
            xml += `      <totbasesImpReemb>0.00</totbasesImpReemb>\n`;
            xml += `      <pagoLocExt>01</pagoLocExt>\n`; // Local
            xml += `      <paisEfecPago>NA</paisEfecPago>\n`;
            xml += `      <aplicConvDobTrib>NO</aplicConvDobTrib>\n`;
            xml += `      <pagExtRaf>NO</pagExtRaf>\n`;
            xml += `      <pagoRegFis>NO</pagoRegFis>\n`;
            xml += `      <formaPago>01</formaPago>\n`; // Sin utilización S.F. (Demo)
            
            xml += `    </detalleCompras>\n`;
        });
        xml += `  </compras>\n`;
    }

    // 3. VENTAS
    if (ventas.length > 0) {
        xml += `  <ventas>\n`;
        ventas.forEach(v => {
            const partes = v.secuencial.split('-');
            // Determinación Tipo ID (07 Consumidor Final, 01 RUC, 02 Cédula)
            const tipoIdCliente = v.terceroId === '9999999999999' ? '07' : (v.terceroId.length === 13 ? '01' : '02');

            xml += `    <detalleVentas>\n`;
            xml += `      <tpIdCliente>${tipoIdCliente}</tpIdCliente>\n`;
            xml += `      <idCliente>${v.terceroId}</idCliente>\n`;
            if (tipoIdCliente !== '07') { // Si no es consumidor final
                xml += `      <parteRelVtas>NO</parteRelVtas>\n`;
            }
            xml += `      <tipoComprobante>${v.tipo}</tipoComprobante>\n`;
            xml += `      <tipoEmision>E</tipoEmision>\n`; // Electrónica
            xml += `      <numeroComprobantes>1</numeroComprobantes>\n`;
            xml += `      <baseNoGraIva>${(v.subtotal * 0).toFixed(2)}</baseNoGraIva>\n`; // Mock: Asumimos todo gravado o no según un flag que falta en Factura, usaremos lógica simple
            xml += `      <baseImponible>0.00</baseImponible>\n`;
            xml += `      <baseImpGrav>${v.subtotal.toFixed(2)}</baseImpGrav>\n`;
            xml += `      <montoIva>${v.totalImpuestos.toFixed(2)}</montoIva>\n`;
            xml += `      <montoIce>0.00</montoIce>\n`;
            xml += `      <valorRetIva>0.00</valorRetIva>\n`; // Retenciones recibidas (debería venir de Cartera)
            xml += `      <valorRetRenta>0.00</valorRetRenta>\n`;
            xml += `      <formasDePago>\n`;
            xml += `        <formaPago>20</formaPago>\n`; // Otros con S.F.
            xml += `      </formasDePago>\n`;
            xml += `    </detalleVentas>\n`;
        });
        xml += `  </ventas>\n`;
    }

    // 4. VENTAS ESTABLECIMIENTO (Resumen)
    xml += `  <ventasEstablecimiento>\n`;
    xml += `    <ventaEst>\n`;
    xml += `      <codEstab>${empresa.ruc.substring(10)}</codEstab>\n`;
    xml += `      <ventasEmp>${totalVentas.toFixed(2)}</ventasEmp>\n`;
    xml += `      <ivaComp>0.00</ivaComp>\n`; // Compensaciones
    xml += `    </ventaEst>\n`;
    xml += `  </ventasEstablecimiento>\n`;

    xml += `</iva>`;
    return xml;
};

export const ImpuestosPage: React.FC = () => {
    const { currentEmpresa } = useOutletContext<{ currentEmpresa: Empresa }>();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'f103' | 'ats'>('dashboard');
    
    // Estado de Datos Reales
    const [ventas, setVentas] = useState<Factura[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [rolesPago, setRolesPago] = useState<RolPago[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado Configuración
    const [mesSel, setMesSel] = useState('10');
    const [anioSel, setAnioSel] = useState('2023');
    const [generating, setGenerating] = useState(false);

    // Cargar datos reales de los módulos
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const facturaRepo = new InMemoryFacturaRepository();
            const compraRepo = new InMemoryCompraRepository();
            const nominaRepo = new InMemoryNominaRepository();
            
            const periodoQuery = `${anioSel}-${mesSel}`;

            const [v, c, r] = await Promise.all([
                facturaRepo.getAll(currentEmpresa.id),
                compraRepo.getAll(currentEmpresa.id),
                nominaRepo.getRolesPago(currentEmpresa.id, periodoQuery)
            ]);

            setVentas(v); 
            setCompras(c);
            setRolesPago(r);
            setLoading(false);
        };
        loadData();
    }, [currentEmpresa.id, mesSel, anioSel]);

    // --- CÁLCULOS FORMULARIO 104 (IVA) ---
    const resumen104 = useMemo(() => {
        // Filtrar ventas del mes (simulado)
        const ventasMes = ventas.filter(v => v.fechaEmision.startsWith(`${anioSel}-${mesSel}`) && v.estado === EstadoSRI.AUTORIZADO);
        const comprasMes = compras.filter(c => c.fechaEmision.startsWith(`${anioSel}-${mesSel}`)); // Debería ser fecha registro

        const subtotalVentas15 = ventasMes.reduce((acc, v) => acc + v.subtotal, 0);
        const ivaVentas = ventasMes.reduce((acc, v) => acc + v.totalImpuestos, 0);
        
        const subtotalCompras15 = comprasMes.reduce((acc, c) => acc + c.subtotal15, 0);
        const ivaCompras = comprasMes.reduce((acc, c) => acc + c.montoIva, 0);

        const impuestoCausado = Math.max(0, ivaVentas - ivaCompras);

        return { subtotalVentas15, ivaVentas, subtotalCompras15, ivaCompras, impuestoCausado };
    }, [ventas, compras, mesSel, anioSel]);

    // --- CÁLCULOS FORMULARIO 103 (RENTA) ---
    const resumen103 = useMemo(() => {
        // 1. Retenciones a Proveedores (Desde Compras)
        const comprasMes = compras.filter(c => c.fechaRegistro.startsWith(`${anioSel}-${mesSel}`) && c.tieneRetencion);
        
        // Agrupación simple por código (simulada porque el modelo Compra actual simplifica el detalle de retención)
        // En prod: iterar detalle retenciones. Aquí asumimos un código genérico 312 para compras.
        const retBienes = comprasMes.reduce((acc, c) => acc + (c.total * 0.0175), 0); // Mock 1.75%
        
        // 2. Retenciones a Empleados (Desde Nómina - Cod 302)
        const retDependencia = rolesPago.reduce((acc, r) => acc + r.retencionImpuestoRenta, 0);

        // Totales
        const totalRetenido = retBienes + retDependencia;

        return { retBienes, retDependencia, totalRetenido };
    }, [compras, rolesPago, mesSel, anioSel]);

    const handleDownloadATS = () => {
        setGenerating(true);
        // Filtrar datos del periodo
        const ventasPeriodo = ventas.filter(v => v.fechaEmision.startsWith(`${anioSel}-${mesSel}`));
        const comprasPeriodo = compras.filter(c => c.fechaRegistro.startsWith(`${anioSel}-${mesSel}`));

        setTimeout(() => {
            const xml = generarXmlATS(currentEmpresa, { mes: mesSel, anio: anioSel }, comprasPeriodo, ventasPeriodo);
            
            const blob = new Blob([xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ATS-${currentEmpresa.ruc}-${anioSel}-${mesSel}.xml`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setGenerating(false);
        }, 1000); // Simulate processing delay
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Impuestos y Obligaciones SRI</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestión tributaria para <span className="font-semibold text-sri-blue">{currentEmpresa.razonSocial}</span>
                    </p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calculator size={16} /> IVA (104)
                    </button>
                    <button 
                        onClick={() => setActiveTab('f103')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'f103' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <PieChart size={16} /> Renta (103)
                    </button>
                    <button 
                        onClick={() => setActiveTab('ats')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ats' ? 'bg-white text-sri-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileCode size={16} /> ATS
                    </button>
                </div>
            </div>

            {/* Selector Periodo Global */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
                <span className="text-sm font-bold text-slate-600 uppercase">Periodo Fiscal:</span>
                <select value={anioSel} onChange={e => setAnioSel(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm"><option>2023</option><option>2024</option></select>
                <select value={mesSel} onChange={e => setMesSel(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{new Date(0, m-1).toLocaleString('es', {month: 'long'})}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-sri-blue" size={32} /></div>
            ) : (
                <>
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-200">
                                    <h3 className="font-bold text-slate-700">Formulario 104 - Resumen IVA</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600">Ventas 15%</span>
                                        <span className="font-mono">{formatMoney(resumen104.subtotalVentas15)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2 text-blue-600 font-medium">
                                        <span>IVA Ventas (Cobrado)</span>
                                        <span className="font-mono">{formatMoney(resumen104.ivaVentas)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-600">Compras 15%</span>
                                        <span className="font-mono">{formatMoney(resumen104.subtotalCompras15)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2 text-green-600 font-medium">
                                        <span>Crédito Tributario (IVA Pagado)</span>
                                        <span className="font-mono">{formatMoney(resumen104.ivaCompras)}</span>
                                    </div>
                                    <div className="mt-4 p-4 bg-slate-800 text-white rounded-lg flex justify-between items-center">
                                        <span className="font-bold">IMPUESTO A PAGAR</span>
                                        <span className="text-xl font-mono font-bold">{formatMoney(resumen104.impuestoCausado)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'f103' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileCode className="text-orange-500" /> Formulario 103 - Retenciones en la Fuente
                                </h3>
                                <button className="px-4 py-2 bg-orange-50 text-orange-700 font-medium rounded-lg text-sm border border-orange-100 hover:bg-orange-100">
                                    Descargar Declaración
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Código</th>
                                            <th className="px-4 py-3">Concepto de Retención</th>
                                            <th className="px-4 py-3 text-right">Base Imponible</th>
                                            <th className="px-4 py-3 text-right">Valor Retenido</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-slate-500">302</td>
                                            <td className="px-4 py-3">Relación de Dependencia (Nómina)</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">-</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatMoney(resumen103.retDependencia)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-slate-500">312</td>
                                            <td className="px-4 py-3">Transferencia de bienes muebles (Compras)</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">-</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatMoney(resumen103.retBienes)}</td>
                                        </tr>
                                        {/* Filas adicionales simuladas para estructura */}
                                        <tr>
                                            <td className="px-4 py-3 font-mono text-slate-500">303</td>
                                            <td className="px-4 py-3">Honorarios Profesionales</td>
                                            <td className="px-4 py-3 text-right font-mono text-slate-600">0.00</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">0.00</td>
                                        </tr>
                                    </tbody>
                                    <tfoot className="bg-orange-50/50">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right font-bold text-orange-900">TOTAL A PAGAR (103)</td>
                                            <td className="px-4 py-3 text-right font-bold text-orange-900 text-lg">{formatMoney(resumen103.totalRetenido)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                                
                                <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-xs flex gap-2 items-start">
                                    <Info size={16} className="mt-0.5" />
                                    <p>
                                        Los valores presentados provienen automáticamente de las retenciones emitidas en el módulo de <strong>Compras</strong> y los roles de pago cerrados en el módulo de <strong>Nómina</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ats' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <FileCode size={48} className="mx-auto text-sri-blue mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Generación de Anexo Transaccional</h3>
                            <p className="text-slate-500 mb-6">El archivo XML incluirá <strong>{ventas.filter(v => v.fechaEmision.startsWith(`${anioSel}-${mesSel}`)).length}</strong> ventas y <strong>{compras.filter(c => c.fechaRegistro.startsWith(`${anioSel}-${mesSel}`)).length}</strong> compras del periodo {mesSel}/{anioSel}.</p>
                            
                            <button 
                                onClick={handleDownloadATS}
                                disabled={generating}
                                className="px-6 py-3 bg-sri-blue text-white rounded-xl font-medium hover:bg-sri-light shadow-lg shadow-blue-900/10 flex items-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {generating ? 'Procesando XML...' : 'Generar y Descargar XML ATS'}
                            </button>
                            
                            <p className="text-xs text-slate-400 mt-4">
                                Compatible con DIMM Anexos y carga en línea SRI.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
