import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { ParametrosContablesValidator } from '@/modules/contabilidad/application/services/ParametrosContablesValidator';
import { NOMINA_CONSTANTS } from '@/shared/constants/nomina.constants';

/**
 * GET /api/nomina/roles
 * Lista roles de pago del periodo
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const periodo = url.searchParams.get('periodo'); // Formato: YYYY-MM

        if (!periodo) {
            return NextResponse.json(
                { error: 'Parámetro periodo requerido (formato: YYYY-MM)' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        r.id, r.periodo, r.empleado_id, r.total_ingresos, r.total_egresos,
                        r.neto_pagar, r.estado, r.created_at, r.updated_at,
                        e.cedula, e.nombres, e.apellidos, e.cargo
                    FROM nomina.nomina_roles r
                    INNER JOIN nomina.empleados e ON e.id = r.empleado_id
                    WHERE r.empresa_id = $1 AND r.periodo = $2
                    ORDER BY e.apellidos ASC, e.nombres ASC
                `,
                values: [context.empresaId, periodo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar roles:', error);
        return NextResponse.json(
            { error: 'Error al consultar roles de pago', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/nomina/roles/generar
 * Genera roles de pago del mes para todos los empleados activos
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { periodo } = body; // Formato: YYYY-MM

        if (!periodo) {
            return NextResponse.json(
                { error: 'Campo periodo requerido (formato: YYYY-MM)' },
                { status: 400 }
            );
        }

        // --- VALIDACIÓN DE PARÁMETROS CONTABLES ---
        const paramsResult = await db.query(
            { text: 'SELECT * FROM configuracion.parametros WHERE empresa_id = $1', values: [context.empresaId] },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );
        const params = paramsResult.rows[0] || {};

        const validacionParams = ParametrosContablesValidator.validarNomina(params);
        if (!validacionParams.valido) {
            return NextResponse.json({ error: validacionParams.error }, { status: 400 });
        }

        // Validar Cierre de Periodo (usando el último día del mes del periodo)
        const [año, mes] = periodo.split('-').map(Number);
        const ultimoDia = new Date(año, mes, 0); // día 0 del siguiente mes es el último del actual
        const validacionCierre = ParametrosContablesValidator.validarFechaCierre(params, ultimoDia);
        if (!validacionCierre.valido) {
            return NextResponse.json({ error: validacionCierre.error }, { status: 400 });
        }

        // Validar que no existan roles para este periodo
        const existingCheck = await db.query<{ count: string }>(
            {
                text: `
                    SELECT COUNT(*) 
                    FROM nomina.nomina_roles 
                    WHERE empresa_id = $1 AND periodo = $2
                `,
                values: [context.empresaId, periodo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        if (parseInt(existingCheck.rows[0].count) > 0) {
            return NextResponse.json(
                { error: `Ya existen roles generados para el periodo ${periodo}` },
                { status: 400 }
            );
        }

        // Generar roles para todos los empleados activos
        const result = await db.transaction(async (client) => {
            // Obt ener empleados activos
            const empleadosResult = await client.query(`
                SELECT id, cedula, nombres, apellidos, sueldo_base
                FROM nomina.empleados
                WHERE empresa_id = $1 AND activo = true
            `, [context.empresaId]);

            const empleados = empleadosResult.rows;

            if (empleados.length === 0) {
                throw new Error('No hay empleados activos para generar nómina');
            }

            // Calcular valores base para cada empleado
            const rolesGenerados: any[] = [];
            const sbuVigente = Number(params.sbu) || NOMINA_CONSTANTS.SBU_DEFAULT;
            const pctAportePersonal = (Number(params.aporte_personal_iess) || NOMINA_CONSTANTS.APORTE_PERSONAL_DEFAULT) / 100;
            const pctAportePatronal = (Number(params.aporte_patronal_iess) || NOMINA_CONSTANTS.APORTE_PATRONAL_DEFAULT) / 100;
            const pctFondoReserva = (Number(params.fondo_reserva_porcentaje) || 8.33) / 100;

            for (const empleado of empleados) {
                const sueldoBase = parseFloat(empleado.sueldo_base);

                // 1. Cálculos de Egresos (Aporte Personal)
                const aportePersonal = sueldoBase * pctAportePersonal; // Parametrizado

                // 2. Provisiones y Beneficios (Gastos para la empresa)
                const aportePatronal = sueldoBase * pctAportePatronal; // Parametrizado
                const decimoTercero = sueldoBase / NOMINA_CONSTANTS.MESES_ANIO;
                const decimoCuarto = sbuVigente / NOMINA_CONSTANTS.MESES_ANIO;
                const fondosReserva = sueldoBase * pctFondoReserva; // Parametrizado
                const vacaciones = sueldoBase / (Number(params.divisor_vacaciones) || 24);

                const totalIngresos = sueldoBase;
                const totalEgresos = aportePersonal; // Sin considerar préstamos/anticipos aquí
                const netoPagar = totalIngresos - totalEgresos;

                // 3. Generar Asiento Contable para este Rol
                // En una app pro, se agruparían todos en un solo asiento, 
                // pero aquí lo haremos por cada uno para simplificar la trazabilidad inicial.
                const glosa = `Nómina ${periodo} - ${empleado.nombres} ${empleado.apellidos}`;
                const asientoResult = await client.query(`
                    INSERT INTO contabilidad.asientos (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                    VALUES ($1, $2, $3, CURRENT_DATE, $4, 'DIARIO', 'MAYORIZADO')
                    RETURNING id
                `, [
                    context.empresaId, context.usuarioId,
                    `NOM-${periodo}-${empleado.cedula.slice(-4)}`,
                    glosa
                ]);
                const asientoId = asientoResult.rows[0].id;

                // Detalles del Asiento (Partida Doble)
                // DEBE: Gastos
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'Sueldos y Salarios')`, [asientoId, params.cuenta_sueldos || '5.1.01.01', sueldoBase]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'Aporte Patronal')`, [asientoId, params.cuenta_aporte_patronal || '5.1.01.02', aportePatronal]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'Décimo Tercero')`, [asientoId, params.cuenta_decimo_tercero || '5.1.01.03', decimoTercero]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'Décimo Cuarto')`, [asientoId, params.cuenta_decimo_cuarto || '5.1.01.04', decimoCuarto]);

                // HABER: Pasivos
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'IESS por Pagar (Per+Pat)')`, [asientoId, params.cuenta_iess_por_pagar || '2.1.03.01', aportePersonal + aportePatronal]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'Sueldos por Pagar')`, [asientoId, params.cuenta_sueldos_por_pagar || '2.1.03.02', netoPagar]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'Prov. Décimo Tercero')`, [asientoId, params.cuenta_prov_decimo_tercero || '2.1.03.03', decimoTercero]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'Prov. Décimo Cuarto')`, [asientoId, params.cuenta_prov_decimo_cuarto || '2.1.03.04', decimoCuarto]);

                // 4. Insertar Rol con todos los detalles
                const rolResult = await client.query(`
                    INSERT INTO nomina.nomina_roles 
                        (empresa_id, usuario_id, empleado_id, periodo, 
                         total_ingresos, total_egresos, neto_pagar, 
                         aporte_personal, aporte_patronal, decimo_tercero, 
                         decimo_cuarto, fondos_reserva, vacaciones,
                         asiento_id, estado, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDIENTE', NOW(), NOW())
                    RETURNING id
                `, [
                    context.empresaId, context.usuarioId, empleado.id, periodo,
                    totalIngresos, totalEgresos, netoPagar,
                    aportePersonal, aportePatronal, decimoTercero,
                    decimoCuarto, fondosReserva, vacaciones,
                    asientoId
                ]);

                rolesGenerados.push({
                    rolId: rolResult.rows[0].id,
                    empleado: `${empleado.nombres} ${empleado.apellidos}`,
                    netoPagar,
                    asientoId
                });
            }

            return { cantidad: rolesGenerados.length, roles: rolesGenerados };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            mensaje: `Nómina del periodo ${periodo} generada exitosamente`,
            ...result
        });
    } catch (error: any) {
        console.error('Error al generar nómina:', error);
        return NextResponse.json(
            { error: error.message || 'Error al generar nómina', details: error.message },
            { status: 500 }
        );
    }
}
/**
 * PUT /api/nomina/roles
 * Registra el pago de un rol de pago
 */
export async function PUT(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { rolId, cuentaBancoId, fechaPago, referencia } = body;

        if (!rolId || !cuentaBancoId || !fechaPago) {
            return NextResponse.json({ error: 'Campos requeridos: rolId, cuentaBancoId, fechaPago' }, { status: 400 });
        }

        const result = await db.transaction(async (client) => {
            // 1. Obtener datos del rol y empleado
            const rolResult = await client.query(`
                SELECT r.*, e.nombres, e.apellidos, e.cedula
                FROM nomina.nomina_roles r
                JOIN nomina.empleados e ON e.id = r.empleado_id
                WHERE r.id = $1 AND r.empresa_id = $2
            `, [rolId, context.empresaId]);

            if (rolResult.rows.length === 0) throw new Error('Rol de pago no encontrado');
            const rol = rolResult.rows[0];

            if (rol.estado === 'PAGADO') throw new Error('Este rol ya ha sido pagado');

            // 1.5 Obtener Parámetros
            const paramsResult = await client.query('SELECT * FROM configuracion.parametros WHERE empresa_id = $1', [context.empresaId]);
            const params = paramsResult.rows[0] || {};

            // 2. Obtener datos de la cuenta bancaria
            const bancoResult = await client.query(`
                SELECT id, nombre, banco, cuenta_contable_codigo
                FROM bancos.bancos_cuentas
                WHERE id = $1 AND empresa_id = $2
            `, [cuentaBancoId, context.empresaId]);

            if (bancoResult.rows.length === 0) throw new Error('Cuenta bancaria no encontrada');
            const banco = bancoResult.rows[0];

            const monto = parseFloat(rol.neto_pagar);

            // 3. Registrar Movimiento Bancario (Egreso)
            await client.query(`
                INSERT INTO bancos.bancos_movimientos
                    (empresa_id, usuario_id, cuenta_id, fecha, tipo, referencia, beneficiario, concepto, monto, es_egreso)
                VALUES ($1, $2, $3, $4, 'TRANSFERENCIA_ENVIADA', $5, $6, $7, $8, true)
            `, [
                context.empresaId, context.usuarioId, cuentaBancoId,
                fechaPago, referencia || 'PAGO NOMINA',
                `${rol.nombres} ${rol.apellidos}`,
                `Pago de Nómina Periodo ${rol.periodo}`,
                monto
            ]);

            // 4. Actualizar Saldo Bancario
            await client.query(`
                UPDATE bancos.bancos_cuentas
                SET saldo_actual = saldo_actual - $1, updated_at = NOW()
                WHERE id = $2
            `, [monto, cuentaBancoId]);

            // 5. Generar Asiento Contable de Pago
            const ctaBanco = banco.cuenta_contable_codigo || '1.1.01.01';

            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                VALUES ($1, $2, $3, $4, $5, 'EGRESO', 'MAYORIZADO')
                RETURNING id
            `, [
                context.empresaId, context.usuarioId,
                `PAG-NOM-${Date.now().toString().slice(-6)}`,
                fechaPago, `Pago Nómina ${rol.periodo} - ${rol.nombres} ${rol.apellidos}`
            ]);
            const asientoId = asientoResult.rows[0].id;

            // Detalles: DEBE Sueldos por Pagar, HABER Banco
            await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'LIQUIDACION DE SUELDO')`, [asientoId, params.cuenta_sueldos_por_pagar || '2.1.03.02', monto]);
            await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'PAGO CON BANCO')`, [asientoId, ctaBanco, monto]);

            // 6. Actualizar Estado del Rol
            await client.query(`
                UPDATE nomina.nomina_roles 
                SET estado = 'PAGADO', updated_at = NOW()
                WHERE id = $1
            `, [rolId]);

            return { success: true };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error al pagar rol:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
