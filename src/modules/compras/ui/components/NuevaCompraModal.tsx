import React, { useState, useEffect } from 'react';
import { Save, Calculator, Search, Receipt, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/context/ToastContext';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { ComprobanteRecibido } from '@/modules/buzon/domain/types';
import { SustentoTributario, OrdenCompra } from '../../domain/types';
import { CodigoRetencion } from '@/modules/configuracion/domain/types';
import { ComprasUseCases, ConfiguracionUseCases, FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useCentrosCostos } from '@/modules/contabilidad/hooks/useContabilidad';
import { useTerceros } from '@/modules/directorio/hooks/useDirectorio';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { formatMoney } from '@/shared/utils/formatearDinero';
import { ModalFooter } from '@/shared/ui/ModalFooter';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { SriStandardizer } from '@/modules/facturacion/domain/services/SriStandardizer';
import { obtenerPeriodoFiscal } from '@/shared/utils/dateUtils';
import { Tercero } from '@/modules/directorio/domain/types';
import { Modal } from '@/shared/ui/Modal';
import { Trash2, Plus } from 'lucide-react';
import { InventarioUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Producto } from '@/modules/inventario/domain/types';


interface Props {
    onClose: () => void;
    onSave: () => void;
    ordenPrevia?: OrdenCompra;
    xmlPrevio?: ComprobanteRecibido;
}

export const NuevaCompraModal: React.FC<Props> = ({ onClose, onSave, ordenPrevia, xmlPrevio }) => {
    const { currentEmpresa } = useEmpresa();
    const { showToast } = useToast();
    const { puntoActivo, puntosDisponibles, cambiarPuntoActivo } = usePuntoEmision();
    const { centros: centrosCostos, cargarCentros } = useCentrosCostos();
    const { cargarTerceros } = useTerceros();
    const { parametros, cargarParametros } = useConfiguracion();
    const [proveedorCompleto, setProveedorCompleto] = useState<Tercero | null>(null);
    const [retencionesDisponibles, setRetencionesDisponibles] = useState<CodigoRetencion[]>([]);

    const [proveedorNombre, setProveedorNombre] = useState(ordenPrevia?.proveedor.razonSocial || xmlPrevio?.razonSocialEmisor || '');
    const [proveedorRuc, setProveedorRuc] = useState(ordenPrevia?.proveedor.ruc || xmlPrevio?.rucEmisor || '');

    // Obtener fecha actual en zona horaria local (no UTC)
    const getFechaLocal = () => {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2, '0');
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const anio = hoy.getFullYear();
        return `${anio}-${mes}-${dia}`;
    };

    const [fechaEmision, setFechaEmision] = useState(xmlPrevio?.fechaEmision || getFechaLocal());
    const [secuencial, setSecuencial] = useState(xmlPrevio?.secuencial || '');
    const [autorizacion, setAutorizacion] = useState(xmlPrevio?.claveAcceso || '');
    const [sustento, setSustento] = useState<SustentoTributario>(SustentoTributario.CREDITO_TRIBUTARIO);

    const [centroCostoId, setCentroCostoId] = useState('');

    const [aplicaRetencion, setAplicaRetencion] = useState(true);
    const [codRetRenta, setCodRetRenta] = useState('');
    const [codRetIva, setCodRetIva] = useState('');

    const [guardando, setGuardando] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [periodoFiscal, setPeriodoFiscal] = useState(fechaEmision.substring(5, 7) + '/' + fechaEmision.substring(0, 4));

    const [detalles, setDetalles] = useState<any[]>([]);

    const buscarProveedor = async () => {
        if (!proveedorRuc) return;
        try {
            const terceros = await cargarTerceros('PROVEEDOR', proveedorRuc);
            if (terceros && terceros.length > 0) {
                const prov = terceros[0];
                setProveedorCompleto(prov);
                setProveedorNombre(prov.razonSocial);
            }
        } catch (error) {
            console.error('Error buscando proveedor:', error);
        }
    };

    useEffect(() => {
        cargarParametros();
    }, [cargarParametros]);

    useEffect(() => {
        if (ordenPrevia) {
            buscarProveedor();
            const ivaVal = parametros?.ivaValor;
            const nuevosDetalles = ordenPrevia.detalles.map(d => {
                const sub = d.cantidad * d.precioUnitario;
                const vIva = d.grabaIva ? (sub * ivaVal / 100) : 0;
                return {
                    productoId: '',
                    descripcion: d.producto,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    subtotal: sub,
                    porcentajeIva: d.grabaIva ? ivaVal : 0,
                    valorIva: vIva,
                    total: sub + vIva
                };
            });
            setDetalles(nuevosDetalles);
        } else if (xmlPrevio) {
            buscarProveedor();
            setDetalles([{
                productoId: '',
                descripcion: 'COMPRA SEGUN XML ' + xmlPrevio.secuencial,
                cantidad: 1,
                precioUnitario: xmlPrevio.montoTotal / (1 + (parametros?.ivaValor) / 100),
                subtotal: xmlPrevio.montoTotal / (1 + (parametros?.ivaValor) / 100),
                porcentajeIva: parametros?.ivaValor,
                valorIva: xmlPrevio.montoTotal - (xmlPrevio.montoTotal / (1 + (parametros?.ivaValor) / 100)),
                total: xmlPrevio.montoTotal
            }]);
        }
    }, [ordenPrevia, xmlPrevio, parametros?.ivaValor]);

    useEffect(() => {
        const loadProductos = async () => {
            try {
                const res = await InventarioUseCases.listarProductos('?limit=1000');
                setProductos(res.data || []);
            } catch (e) {
                console.error('Error cargando productos:', e);
            }
        };
        loadProductos();
    }, []);

    useEffect(() => {
        setPeriodoFiscal(fechaEmision.substring(5, 7) + '/' + fechaEmision.substring(0, 4));
    }, [fechaEmision]);

    useEffect(() => {
        ConfiguracionUseCases.listarRetenciones().then(data => {
            setRetencionesDisponibles(data);
            const defaultRenta = data.find((r: any) => r.tipo === 'RENTA' && r.codigo === '312');
            const defaultIva = data.find((r: any) => r.tipo === 'IVA' && r.codigo === '9');
            if (defaultRenta) setCodRetRenta(defaultRenta.codigo);
            if (defaultIva) setCodRetIva(defaultIva.codigo);
        });

        cargarCentros();
    }, [cargarCentros]);


    // Calcular totales desde los detalles
    const subtotalIva = detalles.reduce((acc, d) => acc + (d.porcentajeIva > 0 ? d.subtotal : 0), 0);
    const subtotal0 = detalles.reduce((acc, d) => acc + (d.porcentajeIva === 0 ? d.subtotal : 0), 0);
    const montoIva = detalles.reduce((acc, d) => acc + d.valorIva, 0);
    const totalFactura = subtotalIva + subtotal0 + montoIva;

    const agregarDetalle = () => {
        setDetalles([...detalles, {
            productoId: '',
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
            porcentajeIva: parametros?.ivaValor,
            valorIva: 0,
            total: 0
        }]);
    };

    const eliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const actualizarDetalle = (index: number, campo: string, valor: any) => {
        const nuevos = [...detalles];
        const d = { ...nuevos[index], [campo]: valor };

        if (campo === 'productoId') {
            const p = productos.find(prod => prod.id === valor);
            if (p) {
                d.descripcion = p.nombre;
                d.precioUnitario = p.costoPromedio || p.precioVenta;
                d.porcentajeIva = p.grabaIva ? (parametros?.ivaValor) : 0;
            }
        }

        d.subtotal = Number((d.cantidad * d.precioUnitario).toFixed(2));
        d.valorIva = Number((d.subtotal * (d.porcentajeIva / 100)).toFixed(2));
        d.total = Number((d.subtotal + d.valorIva).toFixed(2));

        nuevos[index] = d;
        setDetalles(nuevos);
    };

    const selectedRetRenta = retencionesDisponibles.find(c => c.codigo === codRetRenta && c.tipo === 'RENTA');
    const selectedRetIva = retencionesDisponibles.find(c => c.codigo === codRetIva && c.tipo === 'IVA');

    const baseImponibleRenta = subtotalIva + subtotal0;
    const valorRetRenta = Number((baseImponibleRenta * ((selectedRetRenta?.porcentaje || 0) / 100)).toFixed(2));
    const valorRetIva = Number((montoIva * ((selectedRetIva?.porcentaje || 0) / 100)).toFixed(2));
    const totalRetenido = valorRetRenta + valorRetIva;
    const totalPagar = totalFactura - totalRetenido;

    const handleGuardar = async () => {
        if (!proveedorRuc || !secuencial) {
            setErrorValidacion('El RUC del proveedor y el número de comprobante son obligatorios.');
            return;
        }
        if (!proveedorCompleto?.id) {
            setErrorValidacion('Debe buscar el proveedor usando el botón de búsqueda para validar que existe en el directorio.');
            return;
        }

        setGuardando(true);
        setErrorValidacion(null);

        try {
            // Preparar datos de retención si aplica
            let datosRetencion = null;

            if (aplicaRetencion && currentEmpresa && (codRetRenta || codRetIva)) {
                if (!puntoActivo) {
                    throw new Error('Debe tener un punto de emisión asignado y activo para emitir retenciones');
                }

                // Obtener el siguiente secuencial para retención
                const secuencialResponse = await FacturacionUseCases.obtenerSiguienteSecuencial(
                    puntoActivo.puntoEmisionId,
                    '07' // Tipo comprobante: Retención
                );

                if (!secuencialResponse.success) {
                    throw new Error(secuencialResponse.error || 'Error al obtener secuencial de retención');
                }

                // Formatear numDocSustento: debe ser 15 dígitos sin guiones (ej: 001001000000123)
                const numDocSustentoLimpio = secuencial.replace(/-/g, '');
                if (numDocSustentoLimpio.length !== 15) {
                    setErrorValidacion('El número de comprobante debe tener formato 001-001-000000001 (15 dígitos).');
                    setGuardando(false);
                    return;
                }
                const numDocSustentoFormateado = numDocSustentoLimpio;

                // Determinar el código de IVA según el porcentaje configurado
                const getCodigoIva = (porcentaje: number): string => {
                    if (porcentaje === 0) return '0';
                    if (porcentaje === 12) return '2';
                    if (porcentaje === 14) return '3';
                    if (porcentaje === 15) return '4';
                    if (porcentaje === 5) return '5';
                    return '0';
                };

                const ivaPorcentajeActual = parametros?.ivaValor;
                const tieneIva = subtotalIva > 0 && montoIva > 0;
                const codigoIvaDocSustento = tieneIva ? getCodigoIva(ivaPorcentajeActual) : '0';
                const tarifaIvaDocSustento = tieneIva ? ivaPorcentajeActual.toString() : '0';
                const baseImponibleIvaDocSustento = tieneIva ? subtotalIva : (subtotalIva + subtotal0);

                const impuestos = [];
                const codDocSustento = secuencial.startsWith('00') ? '01' : '03';
                if (codDocSustento === '01') {
                    const authLen = autorizacion?.length || 0;
                    if (![10, 49].includes(authLen)) {
                        setErrorValidacion('La autorización del documento sustento es obligatoria (10 o 49 dígitos) para facturas electrónicas.');
                        setGuardando(false);
                        return;
                    }
                }

                if (codRetRenta && valorRetRenta > 0) {
                    impuestos.push({
                        codigo: '1', // RENTA
                        codigoRetencion: codRetRenta,
                        baseImponible: baseImponibleRenta,
                        porcentajeRetener: Number(selectedRetRenta?.porcentaje || 0),
                        valorRetenido: valorRetRenta,
                        codDocSustento: codDocSustento,
                        codSustento: sustento.substring(0, 2) || '01',
                        numDocSustento: numDocSustentoFormateado,
                        fechaEmisionDocSustento: fechaEmision,
                        numAutDocSustento: autorizacion,
                        totalSinImpuestosDocSustento: subtotalIva + subtotal0,
                        baseImponibleIvaDocSustento: baseImponibleIvaDocSustento,
                        importeTotalDocSustento: subtotalIva + subtotal0 + montoIva,
                        codigoPorcentajeIva: codigoIvaDocSustento,
                        tarifaIva: tarifaIvaDocSustento,
                        ivaDocSustento: montoIva
                    });
                }

                if (codRetIva && valorRetIva > 0) {
                    impuestos.push({
                        codigo: '2', // IVA
                        codigoRetencion: codRetIva,
                        baseImponible: montoIva,
                        porcentajeRetener: Number(selectedRetIva?.porcentaje || 0),
                        valorRetenido: valorRetIva,
                        codDocSustento: codDocSustento,
                        codSustento: sustento.substring(0, 2) || '01',
                        numDocSustento: numDocSustentoFormateado,
                        fechaEmisionDocSustento: fechaEmision,
                        numAutDocSustento: autorizacion,
                        totalSinImpuestosDocSustento: subtotalIva + subtotal0,
                        baseImponibleIvaDocSustento: baseImponibleIvaDocSustento,
                        importeTotalDocSustento: subtotalIva + subtotal0 + montoIva,
                        codigoPorcentajeIva: codigoIvaDocSustento,
                        tarifaIva: tarifaIvaDocSustento,
                        ivaDocSustento: montoIva
                    });
                }

                if (impuestos.length > 0) {
                    const tipoIdSujetoRetenido = proveedorCompleto?.tipoIdentificacion || '05';
                    const esParteRelacionada = proveedorCompleto?.parteRelacionada ? 'SI' : 'NO';

                    datosRetencion = SriStandardizer.standardizeRetencion({
                        ambiente: '1',
                        tipoEmision: '1',
                        razonSocial: currentEmpresa.razonSocial,
                        nombreComercial: currentEmpresa.nombreComercial,
                        ruc: currentEmpresa.ruc,
                        estab: puntoActivo.codigoEstablecimiento,
                        ptoEmi: puntoActivo.codigoPunto,
                        secuencial: secuencialResponse.secuencial,
                        dirMatriz: currentEmpresa.direccionMatriz,
                        fechaEmision,
                        obligadoContabilidad: currentEmpresa.obligadoContabilidad ? 'SI' : 'NO',
                        tipoIdentificacionSujetoRetenido: tipoIdSujetoRetenido,
                        parteRel: esParteRelacionada,
                        razonSocialSujetoRetenido: proveedorNombre,
                        identificacionSujetoRetenido: proveedorRuc,
                        periodoFiscal: obtenerPeriodoFiscal(new Date(fechaEmision + 'T00:00:00')),
                        impuestos
                    });
                }
            }

            // Preparar datos del asiento contable
            const selectedCentro = centrosCostos.find(c => c.id === centroCostoId);
            const numeroAsiento = `CC-${crypto.randomUUID().slice(0, 8)}`;
            const glosaAsiento = `P/R Compra Fac/${secuencial} - ${proveedorNombre} ${selectedCentro ? `(${selectedCentro.nombre})` : ''}`;

            // LLAMADA ÚNICA AL ENDPOINT CONSOLIDADO usando ComprasUseCases
            const result = await ComprasUseCases.registrarCompraConRetencion({
                // Datos de la compra
                proveedorId: proveedorCompleto.id,
                tipoComprobante: secuencial.startsWith('00') ? '01' : '03',
                secuencial,
                autorizacion,
                fechaEmision,
                fechaRegistro: new Date().toISOString().split('T')[0],
                sustento,
                descripcion: `Factura ${secuencial} de ${proveedorNombre}`,
                subtotalIva,
                subtotal0,
                montoIva,
                total: totalFactura,
                ordenCompraId: ordenPrevia?.id,
                detalles,

                // Datos del asiento contable
                centroCostoId: centroCostoId || null,
                numeroAsiento,
                glosaAsiento,
                parametros,

                // Datos de retención
                aplicaRetencion,
                datosRetencion,
                puntoEmisionId: puntoActivo?.puntoEmisionId || null
            });

            // Mostrar resultado
            if (result.success) {
                // Si hubo advertencia en la retención, mostrarla
                if (aplicaRetencion && result.retencionSri && !result.retencionSri.success) {
                    showToast(
                        `Compra registrada exitosamente. Advertencia en retención: ${result.retencionSri.error}`,
                        'warning'
                    );
                } else {
                    showToast('Compra registrada exitosamente', 'success');
                }
                onSave();
                onClose();
            }
        } catch (error: any) {
            console.error('Error en NuevaCompraModal:', error);
            setErrorValidacion(error.message || 'Error al registrar la compra');
        } finally {
            setGuardando(false);
        }
    };

    const footer = (
        <ModalFooter
            onCancel={onClose}
            onSubmit={handleGuardar}
            isLoading={guardando}
            isDisabled={!proveedorCompleto?.id || !secuencial || totalFactura === 0}
            submitLabel="Guardar Compra"
            submitIcon={<Save size={20} />}
            submitVariant="outline"
            className="w-full bg-slate-900 -m-6 p-6 text-white rounded-b-2xl border-none"
        >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full pr-6">
                <div className="text-sm opacity-80">
                    {aplicaRetencion ? <span>Se emitirá la retención electrónica automáticamente.</span> : <span>Solo se registrará la compra en el sistema.</span>}
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Total Retención</p>
                        <p className="text-xl font-mono text-red-400 font-bold">-{formatMoney(aplicaRetencion ? totalRetenido : 0)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Neto a Pagar</p>
                        <p className="text-3xl font-mono text-emerald-400 font-bold">{formatMoney(aplicaRetencion ? totalPagar : totalFactura)}</p>
                    </div>
                </div>
            </div>
        </ModalFooter>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Compra"
            description={ordenPrevia ? `Facturando Orden: ${ordenPrevia.secuencial}` : 'Ingreso de factura de proveedor y emisión de retención'}
            icon={<Receipt size={24} />}
            footer={footer}
            size="xl"
        >
            <div className="space-y-8">
                {errorValidacion && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <p className="text-sm font-medium">{errorValidacion}</p>
                    </div>
                )}
                <section>
                    <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Datos del Proveedor y Comprobante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">RUC Proveedor</label>
                            <div className="flex gap-2">
                                <input type="text" value={proveedorRuc} onChange={e => setProveedorRuc(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm" />
                                <button
                                    onClick={buscarProveedor}
                                    className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                                >
                                    <Search size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Razón Social</label>
                            <input type="text" value={proveedorNombre} onChange={e => setProveedorNombre(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Nro. Comprobante</label>
                            <input type="text" value={secuencial} onChange={e => setSecuencial(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm font-mono" placeholder="001-001-..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha Emisión</label>
                            <input type="date" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm text-slate-700" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Centro de Costo</label>
                            <select value={centroCostoId} onChange={e => setCentroCostoId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm">
                                <option value="">-- Asignación General --</option>
                                {centrosCostos.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Autorización (10 o 49 dígitos)</label>
                            <input type="text" value={autorizacion} onChange={e => setAutorizacion(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm font-mono" placeholder="0000000000" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Periodo Fiscal (MM/YYYY)</label>
                            <input type="text" value={periodoFiscal} onChange={e => setPeriodoFiscal(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm font-mono" placeholder="01/2026" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Sustento Tributario</label>
                            <select value={sustento} onChange={e => setSustento(e.target.value as SustentoTributario)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sri-blue/20 transition-all font-medium text-sm">
                                {Object.values(SustentoTributario).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider flex items-center gap-2">
                            <Calculator size={16} /> 2. Detalle de Productos / Servicios
                        </h3>
                        <button
                            onClick={agregarDetalle}
                            className="flex items-center gap-2 px-4 py-2 bg-sri-blue text-white rounded-xl hover:bg-sri-blue/90 transition-all text-xs font-bold shadow-sm"
                        >
                            <Plus size={14} /> Agregar Ítem
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100 mb-6">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Producto / Descripción</th>
                                    <th className="px-4 py-3 w-24 text-center">Cant.</th>
                                    <th className="px-4 py-3 w-32 text-right">P. Unit</th>
                                    <th className="px-4 py-3 w-24 text-center">IVA</th>
                                    <th className="px-4 py-3 w-32 text-right">Total</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {detalles.map((d, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-2">
                                            <select
                                                value={d.productoId}
                                                onChange={e => actualizarDetalle(idx, 'productoId', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-700 mb-1"
                                            >
                                                <option value="">-- Seleccionar Producto --</option>
                                                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigoPrincipal})</option>)}
                                            </select>
                                            <input
                                                type="text"
                                                value={d.descripcion}
                                                onChange={e => actualizarDetalle(idx, 'descripcion', e.target.value)}
                                                placeholder="Descripción detallada..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs text-slate-500 italic"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={d.cantidad}
                                                onChange={e => actualizarDetalle(idx, 'cantidad', Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-bold text-xs outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={d.precioUnitario}
                                                onChange={e => actualizarDetalle(idx, 'precioUnitario', Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-right font-bold text-xs outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={d.porcentajeIva}
                                                onChange={e => actualizarDetalle(idx, 'porcentajeIva', Number(e.target.value))}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center text-[10px] font-bold outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            >
                                                <option value="0">0%</option>
                                                <option value={parametros?.ivaValor}>{parametros?.ivaValor}%</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-slate-900 text-xs">
                                            {formatMoney(d.total)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <button onClick={() => eliminarDetalle(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {detalles.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic text-xs">
                                            No hay ítems agregados. Haga clic en "Agregar Ítem" para comenzar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal {parametros?.ivaValor}%</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{formatMoney(subtotalIva)}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal 0%</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{formatMoney(subtotal0)}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">IVA ({parametros?.ivaValor}%)</p>
                            <p className="text-sm font-mono font-bold text-slate-700">{formatMoney(montoIva)}</p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Factura</p>
                            <p className="text-lg font-mono font-bold text-emerald-400">{formatMoney(totalFactura)}</p>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-sri-blue uppercase tracking-wider">3. Emisión de Retención</h3>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-sm text-slate-600 group-hover:text-sri-blue transition-colors">Generar Retención</span>
                            <input type="checkbox" checked={aplicaRetencion} onChange={e => setAplicaRetencion(e.target.checked)} className="h-5 w-5 text-sri-blue rounded-lg border-slate-300 focus:ring-sri-blue/20" />
                        </label>
                    </div>

                    {aplicaRetencion && puntosDisponibles.length > 1 && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <label className="block text-xs font-bold text-blue-900 mb-2">Punto de Emisión para Retención</label>
                            <select
                                value={puntoActivo?.id || ''}
                                onChange={async (e) => {
                                    const success = await cambiarPuntoActivo(e.target.value);
                                    if (!success) {
                                        showToast('Error al cambiar punto de emisión', 'error');
                                    }
                                }}
                                className="w-full px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {puntosDisponibles.map(punto => (
                                    <option key={punto.id} value={punto.id}>
                                        {punto.codigoCompleto} - {punto.nombrePunto} ({punto.nombreSucursal})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-blue-700 mt-2">Punto activo: <span className="font-bold">{puntoActivo?.codigoCompleto}</span></p>
                        </div>
                    )}

                    {aplicaRetencion ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Impuesto a la Renta
                                </h4>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-2">Concepto de Retención</label>
                                    <select value={codRetRenta} onChange={e => setCodRetRenta(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="">Seleccione...</option>
                                        {retencionesDisponibles.filter(r => r.tipo === 'RENTA').map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.concepto} ({c.porcentaje}%)</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <span className="text-sm text-blue-800 font-medium">Valor a Retener ({selectedRetRenta?.porcentaje || 0}%)</span>
                                    <span className="text-lg font-bold text-blue-900 font-mono">{formatMoney(valorRetRenta)}</span>
                                </div>
                            </div>
                            <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Impuesto al Valor Agregado (IVA)
                                </h4>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-2">Porcentaje Retención IVA</label>
                                    <select value={codRetIva} onChange={e => setCodRetIva(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500/20">
                                        <option value="">Seleccione...</option>
                                        {retencionesDisponibles.filter(r => r.tipo === 'IVA').map(p => <option key={p.codigo} value={p.codigo}>{p.codigo} - {p.concepto}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-between items-center bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <span className="text-sm text-emerald-800 font-medium">Valor a Retener ({selectedRetIva?.porcentaje || 0}%)</span>
                                    <span className="text-lg font-bold text-emerald-900 font-mono">{formatMoney(valorRetIva)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 bg-slate-50 rounded-2xl text-center text-slate-500 text-sm italic border border-dashed border-slate-300">
                            No se generará comprobante de retención para esta compra.
                        </div>
                    )}
                </section>
            </div>
        </Modal>
    );
};
