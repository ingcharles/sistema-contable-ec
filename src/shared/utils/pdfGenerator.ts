import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatMoney } from './formatearDinero';

interface ComprobanteData {
    tipo: 'INGRESO' | 'EGRESO';
    numero: string;
    fecha: string;
    beneficiario: string;
    monto: number;
    concepto: string;
    referencia?: string;
    cuentaBanco?: string;
    empresa: {
        nombre: string;
        ruc: string;
        direccion?: string;
    };
}

export const generateReceiptPDF = (data: ComprobanteData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Encabezado
    doc.setFontSize(18);
    doc.setTextColor(14, 165, 233); // sri-blue
    doc.text(data.empresa.nombre.toUpperCase(), 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`RUC: ${data.empresa.ruc}`, 15, 26);
    if (data.empresa.direccion) {
        doc.text(data.empresa.direccion, 15, 31);
    }

    // Título del Comprobante
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    const title = `COMPROBANTE DE ${data.tipo}`;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth - titleWidth - 15, 20);

    doc.setFontSize(12);
    doc.text(`No. ${data.numero}`, pageWidth - doc.getTextWidth(`No. ${data.numero}`) - 15, 27);

    // 2. Información General
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 40, pageWidth - 15, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA:', 15, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(data.fecha, 45, 50);

    doc.setFont('helvetica', 'bold');
    doc.text(data.tipo === 'INGRESO' ? 'RECIBIDO DE:' : 'PAGADO A:', 15, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(data.beneficiario, 45, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('LA SUMA DE:', 15, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMoney(data.monto), 45, 66);

    // 3. Detalle
    autoTable(doc, {
        startY: 75,
        head: [['CONCEPTO', 'REFERENCIA', 'VALOR']],
        body: [
            [
                data.concepto,
                data.referencia || 'N/A',
                formatMoney(data.monto)
            ]
        ],
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] }, // sri-blue
        columnStyles: {
            2: { halign: 'right' }
        }
    });

    // 4. Firmas
    const finalY = (doc as any).lastAutoTable.finalY + 30;

    doc.line(20, finalY, 70, finalY);
    doc.text('ELABORADO POR', 30, finalY + 5);

    doc.line(pageWidth - 70, finalY, pageWidth - 20, finalY);
    doc.text('RECIBÍ CONFORME', pageWidth - 60, finalY + 5);

    // 5. Pie de página
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Generado por EcuContable Pro - Software Contable Inteligente', pageWidth / 2, 285, { align: 'center' });

    // Descargar/Abrir
    doc.save(`Comprobante_${data.tipo}_${data.numero}.pdf`);
};

interface RolPagoData {
    empleado: {
        nombre: string;
        cedula: string;
        cargo: string;
        sueldoBase: number;
    };
    periodo: string;
    ingresos: {
        sueldoBase: number;
        horasExtras?: number;
        comisiones?: number;
        bonos?: number;
        otros?: number;
    };
    egresos: {
        aportePersonal: number;
        anticipos?: number;
        prestamos?: number;
        otros?: number;
    };
    provisiones: {
        decimoTercero: number;
        decimoCuarto: number;
        fondosReserva: number;
        vacaciones: number;
        aportePatronal: number;
    };
    netoPagar: number;
    empresa: {
        nombre: string;
        ruc: string;
        direccion?: string;
    };
}

export const generatePayrollPDF = (data: RolPagoData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Encabezado
    doc.setFontSize(18);
    doc.setTextColor(14, 165, 233); // sri-blue
    doc.text(data.empresa.nombre.toUpperCase(), 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`RUC: ${data.empresa.ruc}`, 15, 26);
    if (data.empresa.direccion) {
        doc.text(data.empresa.direccion, 15, 31);
    }

    // Título
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    const title = 'ROL DE PAGOS';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, pageWidth - titleWidth - 15, 20);

    doc.setFontSize(10);
    doc.text(`Período: ${data.periodo}`, pageWidth - doc.getTextWidth(`Período: ${data.periodo}`) - 15, 27);

    // 2. Información del Empleado
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 40, pageWidth - 15, 40);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO', 15, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${data.empleado.nombre}`, 15, 55);
    doc.text(`Cédula: ${data.empleado.cedula}`, 15, 61);
    doc.text(`Cargo: ${data.empleado.cargo}`, 15, 67);
    doc.text(`Sueldo Base: ${formatMoney(data.empleado.sueldoBase)}`, 15, 73);

    // 3. Tabla de Ingresos
    let currentY = 85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INGRESOS', 15, currentY);

    const ingresosData = [
        ['Sueldo Base', formatMoney(data.ingresos.sueldoBase)],
    ];
    if (data.ingresos.horasExtras) ingresosData.push(['Horas Extras', formatMoney(data.ingresos.horasExtras)]);
    if (data.ingresos.comisiones) ingresosData.push(['Comisiones', formatMoney(data.ingresos.comisiones)]);
    if (data.ingresos.bonos) ingresosData.push(['Bonos', formatMoney(data.ingresos.bonos)]);
    if (data.ingresos.otros) ingresosData.push(['Otros Ingresos', formatMoney(data.ingresos.otros)]);

    const totalIngresos = Object.values(data.ingresos).reduce((sum, val) => sum + (val || 0), 0);
    ingresosData.push(['TOTAL INGRESOS', formatMoney(totalIngresos)]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Concepto', 'Valor']],
        body: ingresosData,
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.index === ingresosData.length - 1) {
                data.cell.styles.fillColor = [241, 245, 249]; // slate-100
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [30, 41, 59]; // slate-800
            }
        }
    });

    // 4. Tabla de Egresos
    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('EGRESOS', 15, currentY);

    const egresosData = [
        ['Aporte Personal IESS (9.45%)', formatMoney(data.egresos.aportePersonal)],
    ];
    if (data.egresos.anticipos) egresosData.push(['Anticipos', formatMoney(data.egresos.anticipos)]);
    if (data.egresos.prestamos) egresosData.push(['Préstamos', formatMoney(data.egresos.prestamos)]);
    if (data.egresos.otros) egresosData.push(['Otros Egresos', formatMoney(data.egresos.otros)]);

    const totalEgresos = Object.values(data.egresos).reduce((sum, val) => sum + (val || 0), 0);
    egresosData.push(['TOTAL EGRESOS', formatMoney(totalEgresos)]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Concepto', 'Valor']],
        body: egresosData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], fontSize: 10 }, // red-500
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.index === egresosData.length - 1) {
                data.cell.styles.fillColor = [254, 226, 226]; // red-100
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [30, 41, 59];
            }
        }
    });

    // 5. Neto a Pagar
    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(14, 165, 233); // sri-blue
    doc.rect(15, currentY, pageWidth - 30, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('NETO A PAGAR:', 20, currentY + 8);
    doc.text(formatMoney(data.netoPagar), pageWidth - 20, currentY + 8, { align: 'right' });

    // 6. Provisiones y Aportes Patronales
    currentY = currentY + 20;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text('PROVISIONES Y APORTES PATRONALES', 15, currentY);

    const provisionesData = [
        ['Décimo Tercer Sueldo', formatMoney(data.provisiones.decimoTercero)],
        ['Décimo Cuarto Sueldo', formatMoney(data.provisiones.decimoCuarto)],
        ['Fondos de Reserva', formatMoney(data.provisiones.fondosReserva)],
        ['Vacaciones', formatMoney(data.provisiones.vacaciones)],
        ['Aporte Patronal IESS (11.15%)', formatMoney(data.provisiones.aportePatronal)],
    ];

    const totalProvisiones = Object.values(data.provisiones).reduce((sum, val) => sum + val, 0);
    provisionesData.push(['TOTAL COSTO EMPRESA', formatMoney(totalProvisiones)]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Concepto', 'Valor']],
        body: provisionesData,
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247], fontSize: 10 }, // purple-500
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.row.index === provisionesData.length - 1) {
                data.cell.styles.fillColor = [243, 232, 255]; // purple-100
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = [30, 41, 59];
            }
        }
    });

    // 7. Firmas
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.line(20, finalY, 80, finalY);
    doc.text('FIRMA EMPLEADOR', 35, finalY + 5);

    doc.line(pageWidth - 80, finalY, pageWidth - 20, finalY);
    doc.text('FIRMA EMPLEADO', pageWidth - 65, finalY + 5);

    // 8. Pie de página
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generado por EcuContable Pro - Software Contable Inteligente', pageWidth / 2, 285, { align: 'center' });

    // Descargar
    const fileName = `Rol_${data.empleado.nombre.replace(/\s+/g, '_')}_${data.periodo}.pdf`;
    doc.save(fileName);
};

export const generateEstadoCuentaPDF = (
    empresa: any,
    cliente: any,
    documentos: any[],
    tipo: 'CXC' | 'CXP',
    fechaCorte: Date = new Date()
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Encabezado
    doc.setFontSize(18);
    // sri-blue
    doc.setTextColor(14, 165, 233);
    doc.text(empresa.nombre_comercial || 'Empresa', 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`RUC: ${empresa.ruc}`, 15, 26);
    if (empresa.direccion) {
        doc.text(empresa.direccion.substring(0, 80), 15, 31);
    }

    // Título del Reporte
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    const titulo = `ESTADO DE CUENTA - ${tipo === 'CXC' ? 'CLIENTE' : 'PROVEEDOR'}`;
    const tituloWidth = doc.getTextWidth(titulo);
    doc.text(titulo, pageWidth - tituloWidth - 15, 20);

    // Info Cliente
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(tipo === 'CXC' ? 'CLIENTE:' : 'PROVEEDOR:', 15, 45);
    doc.setFont('helvetica', 'normal');
    // Validar que cliente y razon_social existen
    doc.text(cliente?.razon_social || 'N/A', 40, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('RUC/CI:', 15, 51);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente?.identificacion || 'N/A', 40, 51);

    doc.setFont('helvetica', 'bold');
    doc.text('FECHA CORTE:', pageWidth - 60, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaCorte.toLocaleDateString(), pageWidth - 60, 51);

    // Tabla de Documentos
    const tableBody = documentos.map(doc => [
        new Date(doc.fecha_emision).toLocaleDateString(),
        doc.nro_comprobante,
        new Date(doc.fecha_vencimiento).toLocaleDateString(),
        doc.dias_vencidos > 0 ? doc.dias_vencidos : '-',
        formatMoney(Number(doc.monto_total)),
        formatMoney(Number(doc.saldo_pendiente))
    ]);

    const totalPendiente = documentos.reduce((sum, d) => sum + Number(d.saldo_pendiente), 0);
    const totalVencido = documentos.reduce((sum, d) => sum + (d.dias_vencidos > 0 ? Number(d.saldo_pendiente) : 0), 0);

    autoTable(doc, {
        startY: 60,
        head: [['Emisión', 'Documento', 'Vencimiento', 'Días Venc.', 'Total', 'Saldo Pendiente']],
        body: tableBody,
        foot: [['', '', '', 'TOTAL', '', formatMoney(totalPendiente)]],
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [14, 165, 233] }, // sri-blue
        footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' }, // slate-100, slate-800
        columnStyles: {
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // Resumen
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Saldos:', 15, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Por Vencer: ${formatMoney(totalPendiente - totalVencido)}`, 15, finalY + 7);

    doc.setTextColor(220, 38, 38); // red-600
    doc.text(`Total Vencido: ${formatMoney(totalVencido)}`, 15, finalY + 13);

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleString()}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`EstadoCuenta_${cliente?.identificacion || 'Consolidado'}_${new Date().toISOString().split('T')[0]}.pdf`);
};
