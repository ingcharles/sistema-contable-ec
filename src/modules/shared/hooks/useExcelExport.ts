import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExcelExportOptions {
    title: string;
    periodo?: {
        inicio: Date;
        fin: Date;
        corte?: Date;
    };
    headers: string[];
    data: any[][];
    filename: string;
    empresa: {
        razonSocial: string;
        ruc: string;
        direccion?: string;
    };
    headerColor?: string; // Hex color like #3F51B5
}

export const useExcelExport = () => {
    // Convertir color hex a objeto RGB para Excel
    const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            };
        }
        return { r: 100, g: 116, b: 139 }; // Default slate-500
    };

    const exportToExcel = ({
        title,
        periodo,
        headers,
        data,
        filename,
        empresa,
        headerColor = '#64748b' // Default slate-500
    }: ExcelExportOptions) => {
        // 1. Crear workbook
        const wb = XLSX.utils.book_new();

        // 2. Preparar filas del encabezado empresarial
        const headerRows = [
            [empresa.razonSocial.toUpperCase()],
            [`RUC: ${empresa.ruc}`],
            [empresa.direccion || ''],
            [title.toUpperCase()],
        ];

        // Agregar periodo si existe
        if (periodo) {
            if (periodo.corte) {
                headerRows.push([`AL ${format(periodo.corte, 'dd DE MMMM DEL yyyy', { locale: es }).toUpperCase()}`]);
            } else if (periodo.inicio && periodo.fin) {
                const desde = format(periodo.inicio, 'dd/MM/yyyy', { locale: es });
                const hasta = format(periodo.fin, 'dd/MM/yyyy', { locale: es });
                headerRows.push([`DEL ${desde} AL ${hasta}`]);
            }
        }

        headerRows.push([]); // Espacio en blanco

        // 3. Combinar datos
        const finalData = [
            ...headerRows,
            headers,
            ...data
        ];

        // 4. Crear worksheet desde array
        const ws = XLSX.utils.aoa_to_sheet(finalData);

        // 5. Aplicar estilos a las celdas de encabezado de tabla
        const headerRowIndex = headerRows.length; // Índice de fila donde están los headers de tabla
        const rgb = hexToRgb(headerColor);

        // Estilos para headers de tabla
        for (let col = 0; col < headers.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
            if (!ws[cellAddress]) continue;

            ws[cellAddress].s = {
                fill: {
                    fgColor: { rgb: `${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`.toUpperCase() }
                },
                font: {
                    bold: true,
                    color: { rgb: 'FFFFFF' }
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center'
                }
            };
        }

        // 6. Ancho de columnas
        const colWidths = headers.map((header, i) => {
            let maxLen = header.length;
            const sampleSize = Math.min(data.length, 20);
            for (let j = 0; j < sampleSize; j++) {
                const cellValue = data[j][i] ? String(data[j][i]) : '';
                maxLen = Math.max(maxLen, cellValue.length);
            }
            return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
        });

        ws['!cols'] = colWidths;

        // 7. Merge de celdas del encabezado empresarial
        const mergeEndCol = Math.max(headers.length - 1, 4);
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: mergeEndCol } }, // Razon Social
            { s: { r: 1, c: 0 }, e: { r: 1, c: mergeEndCol } }, // RUC
            { s: { r: 2, c: 0 }, e: { r: 2, c: mergeEndCol } }, // Direccion
            { s: { r: 3, c: 0 }, e: { r: 3, c: mergeEndCol } }, // Titulo Reporte
            { s: { r: 4, c: 0 }, e: { r: 4, c: mergeEndCol } }, // Periodo
        ];

        // 8. Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");

        // 9. Descargar archivo con opciones de celda
        XLSX.writeFile(wb, filename, { cellStyles: true });
    };

    return { exportToExcel };
};
