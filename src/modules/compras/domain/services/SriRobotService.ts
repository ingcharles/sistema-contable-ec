import { db } from '@/shared/infrastructure/database/postgresql';
import { decrypt } from '@/shared/utils/cryptoService';

/**
 * Servicio para automatizar la descarga de comprobantes electrónicos
 * desde el portal del SRI usando Playwright.
 * 
 * NOTA: Requiere que Playwright esté instalado:
 *   npm install playwright
 *   npx playwright install chromium
 */
export class SriRobotService {

    /**
     * Ejecuta el flujo completo de descarga para un período dado.
     * 1. Obtiene credenciales SRI de la empresa
     * 2. Login al portal SRI
     * 3. Navega a comprobantes recibidos
     * 4. Descarga XMLs por clave de acceso
     * 5. Guarda en compras.comprobantes_descargados
     */
    static async ejecutarDescarga(
        empresaId: string,
        usuarioId: string,
        descargaId: string,
        anio: number,
        mes: number,
        tipoDocumento: string = 'TODOS',
        registroDesde?: number,
        registroHasta?: number
    ): Promise<{ total: number; descargados: number; errores: string[] }> {
        const errores: string[] = [];
        let totalEncontrados = 0;
        let totalDescargados = 0;

        console.log(`[SRI-ROBOT] Iniciando descarga ${descargaId} para ${mes}/${anio}`);

        try {
            // 1. Marcar descarga como EN_CURSO
            await db.query(
                {
                    text: `UPDATE compras.descargas_robot SET estado = 'EN_CURSO', fecha_inicio = NOW(), updated_at = NOW() WHERE id = $1`,
                    values: [descargaId]
                },
                { empresaId, usuarioId }
            );

            // 2. Obtener credenciales SRI
            const certResult = await db.query(
                {
                    text: `SELECT usuario_sri, clave_sri FROM configuracion.sri_certificados WHERE empresa_id = $1 AND activo = TRUE LIMIT 1`,
                    values: [empresaId]
                },
                { empresaId, usuarioId }
            );

            if (certResult.rows.length === 0 || !certResult.rows[0].usuario_sri) {
                console.error('[SRI-ROBOT] No hay credenciales configuradas');
                throw new Error('No se encontraron credenciales SRI configuradas. Configure usuario y clave en Configuración → Firma Electrónica.');
            }

            const { usuario_sri, clave_sri } = certResult.rows[0];
            const claveDesencriptada = decrypt(clave_sri);
            console.log(`[SRI-ROBOT] Credenciales encontradas - Usuario: ${usuario_sri}`);

            // 3. Importar Playwright-Extra con Stealth Plugin
            // El plugin stealth parchea automáticamente 12+ indicadores de detección:
            // navigator.webdriver, chrome.runtime, plugins, languages, permissions,
            // WebGL vendor/renderer, User-Agent inconsistencies, etc.
            // Esto eleva el score de reCAPTCHA v3 de ~0.1 (bot) a ~0.7-0.9 (humano).
            let chromium;
            try {
                // eslint-disable-next-line no-eval
                const { chromium: cr } = eval("require")('playwright-extra');
                const StealthPlugin = eval("require")('puppeteer-extra-plugin-stealth');
                cr.use(StealthPlugin());
                chromium = cr;
                console.log('[SRI-ROBOT] ✅ Stealth plugin cargado (anti-detección automática)');
            } catch {
                console.error('[SRI-ROBOT] playwright-extra no instalado, intentando playwright estándar...');
                try {
                    const playwright = eval("require")('playwright');
                    chromium = playwright.chromium;
                    console.warn('[SRI-ROBOT] ⚠️ Usando playwright estándar SIN stealth - reCAPTCHA puede fallar');
                } catch {
                    throw new Error('Playwright no está instalado. Ejecute: npm install playwright-extra puppeteer-extra-plugin-stealth && npx playwright install chromium');
                }
            }

            // 4. Iniciar navegador con configuración anti-detección
            console.log('[SRI-ROBOT] Lanzando navegador...');
            const browser = await chromium.launch({
                headless: false,
                slowMo: 150,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--start-maximized',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-dev-shm-usage'
                ],
                ignoreDefaultArgs: ['--enable-automation']
            });

            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                viewport: { width: 1920, height: 1080 },
                locale: 'es-EC',
                timezoneId: 'America/Guayaquil',
                permissions: ['geolocation'],
                geolocation: { latitude: -0.1807, longitude: -78.4678 },
                extraHTTPHeaders: {
                    'Accept-Language': 'es-EC,es;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                javaScriptEnabled: true,
                bypassCSP: true,
                ignoreHTTPSErrors: true
            });

            const page = await context.newPage();

            // NOTA: El stealth plugin (playwright-extra) ya maneja automáticamente
            // la ocultación de automatización en cada página nueva.
            // No se necesita ocultarAutomacion() manual.

            console.log('[SRI-ROBOT] Navegador iniciado (con stealth anti-detección)');

            try {
                // 5. Navegar a Home SRI (Flujo natural)
                console.log('[SRI-ROBOT] Navegando a Home SRI...');
                await page.goto('https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT', {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                // Simulación inicial de comportamiento humano
                //await this.simularComportamientoHumano(page);

                // 5.1 Clic en botón "Iniciar Sesión"
                console.log('[SRI-ROBOT] Buscando botón Iniciar Sesión...');
                try {
                    const selectorBtnLogin = 'a[href*="/contribuyente/perfil"]';
                    await page.waitForSelector(selectorBtnLogin, { timeout: 10000 });

                    // Movimiento humano hacia el botón
                    const loginBtn = page.locator(selectorBtnLogin);
                    const box = await loginBtn.boundingBox();
                    if (box) {
                        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
                        await page.waitForTimeout(400);
                    }

                    await page.click(selectorBtnLogin);
                    console.log('[SRI-ROBOT] Clic en Iniciar Sesión realizado.');
                } catch (e) {
                    console.log('[SRI-ROBOT] No se encontró botón Iniciar Sesión o ya estamos redirigidos.');
                }

                await page.waitForTimeout(3000);

                if (page.url().includes('/auth/') || await page.isVisible('#usuario').catch(() => false)) {
                    console.log('[SRI-ROBOT] Detectada página de Login. Autenticando...');

                    // Cerrar overlays molestos
                    try {
                        await page.evaluate(() => {
                            const overlays = ['#disablingDiv', '#noSoportado', '#advertenciaNavegador'];
                            overlays.forEach(sel => {
                                const el = document.querySelector(sel);
                                if (el) (el as HTMLElement).style.display = 'none';
                            });
                        });
                    } catch (ignore) { }

                    await page.waitForSelector('#usuario', { timeout: 30000 });

                    // Simular lectura antes de llenar
                    await page.waitForTimeout(800);

                    // Ingresar usuario con movimiento de mouse
                    const usuarioInput = page.locator('#usuario');
                    const usuarioBox = await usuarioInput.boundingBox();
                    if (usuarioBox) {
                        await page.mouse.move(usuarioBox.x + 50, usuarioBox.y + 10, { steps: 12 });
                        await page.waitForTimeout(300);
                    }

                    console.log('[SRI-ROBOT] Ingresando credenciales...');
                    await page.fill('#usuario', usuario_sri);
                    await page.waitForTimeout(500);

                    // Ingresar password con typing lento
                    const passwordInput = page.locator('#password');
                    const passwordBox = await passwordInput.boundingBox();
                    if (passwordBox) {
                        await page.mouse.move(passwordBox.x + 50, passwordBox.y + 10, { steps: 10 });
                        await page.waitForTimeout(300);
                    }

                    await page.type('#password', claveDesencriptada, { delay: 100 });
                    await page.waitForTimeout(700);

                    // Click en botón Ingresar con movimiento natural
                    console.log('[SRI-ROBOT] Enviando formulario...');
                    const btnSubmit = '#kc-login';
                    await page.waitForSelector(btnSubmit);

                    const submitBtn = page.locator(btnSubmit);
                    const submitBox = await submitBtn.boundingBox();
                    if (submitBox) {
                        await page.mouse.move(submitBox.x + submitBox.width / 2, submitBox.y + submitBox.height / 2, { steps: 15 });
                        await page.waitForTimeout(500);
                    }

                    await page.click(btnSubmit, { delay: 150 });

                    console.log('[SRI-ROBOT] Login enviado. Esperando redirección...');

                    try {
                        await page.waitForNavigation({ timeout: 1500, waitUntil: 'domcontentloaded' });
                    } catch (e) {
                        console.log('[SRI-ROBOT] Timeout esperando navegación post-login. Verificando estado...');
                    }
                }

                // Verificación de errores en Login
                if (page.url().includes('/auth/') || await page.isVisible('#kc-form-login').catch(() => false)) {
                    console.log('[SRI-ROBOT] Seguimos en página de Login. Buscando errores...');

                    const errorSelector = '.alert-error, .pf-c-alert.pf-m-danger, .kc-feedback-text';
                    let errorMsg = '';
                    try {
                        if (await page.isVisible(errorSelector)) {
                            errorMsg = await page.textContent(errorSelector) || '';
                            console.error(`[SRI-ROBOT] Error detectado en pantalla: ${errorMsg.trim()}`);
                        }
                    } catch (e) { }

                    // Dump para debug
                    try {
                        const fs = eval("require")('fs');
                        const path = eval("require")('path');
                        const timestamp = Date.now();
                        const debugHtml = await page.content();
                        const debugFile = path.resolve(`sri_login_failed_${timestamp}.html`);
                        const debugPng = path.resolve(`sri_login_failed_${timestamp}.png`);
                        fs.writeFileSync(debugFile, debugHtml);
                        await page.screenshot({ path: debugPng, fullPage: true });
                        console.log(`[SRI-ROBOT] Login fallido. Dump guardado en: ${debugFile}`);
                    } catch (e) {
                        console.error('Error guardando dump login:', e);
                    }

                    throw new Error(`No se pudo salir de la página de login. ${errorMsg ? 'Mensaje SRI: ' + errorMsg.trim() : 'Posible credencial incorrecta o bloqueo.'}`);
                }

                // Login exitoso - Simulación crucial antes de navegar
                console.log('[SRI-ROBOT] Login exitoso. Simulando comportamiento humano...');
                await this.simularComportamientoHumano(page);
                await page.waitForTimeout(1000);

                // Navegar a Comprobantes Recibidos
                const currentUrl = page.url();
                console.log(`[SRI-ROBOT] URL post-login: ${currentUrl}`);

                if (!currentUrl.includes('comprobantesRecibidos.jsf')) {
                    console.log(`[SRI-ROBOT] Redirigiendo a Comprobantes Recibidos...`);

                    // Movimiento de mouse antes de navegar
                    await page.mouse.move(500, 300, { steps: 20 });
                    await page.waitForTimeout(800);

                    const targetUrl = 'https://srienlinea.sri.gob.ec/tuportal-internet/accederAplicacion.jspa?redireccion=57&idGrupo=55';
                    await page.goto(targetUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 60000
                    });

                    // CRÍTICO: Simulación después de cargar
                    await page.waitForTimeout(2000);
                    await this.simularComportamientoHumano(page);
                }

                console.log('[SRI-ROBOT] En página de Comprobantes. Configurando filtros...');

                // Configurar filtros de fecha
                const mesStr = mes.toString().padStart(2, '0');
                const fechaDesde = `01/${mesStr}/${anio}`;
                const ultimoDia = new Date(anio, mes, 0).getDate();
                const fechaHasta = `${ultimoDia}/${mesStr}/${anio}`;
                console.log(`[SRI-ROBOT] Filtrando fechas: ${fechaDesde} - ${fechaHasta}`);

                try {
                    const selFechaDesde = 'input[id*="fechaDesde"], input[name*="fechaDesde"]';
                    const selFechaHasta = 'input[id*="fechaHasta"], input[name*="fechaHasta"]';

                    let hasDateRange = false;
                    try {
                        await page.waitForSelector(selFechaDesde, { state: 'visible', timeout: 3000 });
                        hasDateRange = true;
                    } catch (e) {
                        hasDateRange = false;
                    }

                    if (hasDateRange) {
                        console.log('[SRI-ROBOT] Detectados inputs de fecha (Rango). Llenando...');
                        await page.fill(selFechaDesde, fechaDesde);
                        await page.waitForTimeout(200);
                        await page.fill(selFechaHasta, fechaHasta);
                        await page.waitForTimeout(200);
                    } else {
                        console.log('[SRI-ROBOT] Buscando selects de Año/Mes/Día (PrimeFaces)...');
                        const selAnio = 'select[name*="ano"]';
                        const selMes = 'select[name*="mes"]';
                        const selDia = 'select[name*="dia"]';

                        try {
                            await page.waitForSelector(selAnio, { state: 'visible', timeout: 30000 });

                            console.log(`[SRI-ROBOT] Seleccionando Año: ${anio}, Mes: ${mes}`);

                            // Movimiento hacia select Año
                            const selectAnio = page.locator(selAnio);
                            const boxAnio = await selectAnio.boundingBox();
                            if (boxAnio) {
                                await page.mouse.move(boxAnio.x + boxAnio.width / 2, boxAnio.y + boxAnio.height / 2, { steps: 15 });
                                await page.waitForTimeout(400);
                            }

                            await page.selectOption(selAnio, { value: anio.toString() });
                            await page.waitForTimeout(500 + Math.random() * 300);

                            // Movimiento hacia select Mes
                            const selectMes = page.locator(selMes);
                            const boxMes = await selectMes.boundingBox();
                            if (boxMes) {
                                await page.mouse.move(boxMes.x + boxMes.width / 2, boxMes.y + boxMes.height / 2, { steps: 12 });
                                await page.waitForTimeout(300);
                            }

                            await page.selectOption(selMes, { value: mes.toString() });
                            await page.waitForTimeout(500 + Math.random() * 300);

                            // Movimiento hacia select Día
                            if (await page.isVisible(selDia)) {
                                console.log('[SRI-ROBOT] Seleccionando Día: Todos (0)');
                                const selectDia = page.locator(selDia);
                                const boxDia = await selectDia.boundingBox();
                                if (boxDia) {
                                    await page.mouse.move(boxDia.x + boxDia.width / 2, boxDia.y + boxDia.height / 2, { steps: 10 });
                                    await page.waitForTimeout(250);
                                }
                                await page.selectOption(selDia, { value: '0' });
                                await page.waitForTimeout(600);
                            }
                        } catch (e) {
                            console.error('[SRI-ROBOT] Timeout esperando selectores de Año:', e);
                            throw new Error('No se encontraron selectores de fecha (ni inputs ni combobox) tras espera.');
                        }
                    }

                    // Si es tipo específico, seleccionar
                    if (tipoDocumento !== 'TODOS') {
                        const tipoMap: Record<string, string> = {
                            'FACTURA': '1',
                            'NOTA_CREDITO': '3',
                            'NOTA_DEBITO': '4',
                            'RETENCION': '6',
                            'LIQUIDACION': '2'
                        };
                        const codigoTipo = tipoMap[tipoDocumento] || '';
                        if (codigoTipo) {
                            const selTipo = 'select[name*="cmbTipoComprobante"]';
                            if (await page.isVisible(selTipo)) {
                                await page.selectOption(selTipo, codigoTipo);
                                await page.waitForTimeout(400);
                            }
                        }
                    }

                    // ═══════════════════════════════════════════════════════════════
                    // CONSULTAR con reCAPTCHA Enterprise del SRI
                    // Site key: 6LdukTQsAAAAAIcciM4GZq4ibeyplUhmWvlScuQE
                    // Acción: 'consulta_cel_recibidos'
                    // El score Enterprise depende de: tiempo en página, movimientos
                    // de mouse, scroll, interacciones previas. Necesitamos simular
                    // comportamiento humano extenso ANTES de hacer clic.
                    // ═══════════════════════════════════════════════════════════════

                    console.log('[SRI-ROBOT] Preparando click en "Consultar" (reCAPTCHA Enterprise)...');
                    console.log('[SRI-ROBOT] 🧠 Simulando comportamiento humano extendido para mejorar score...');

                    // ── SIMULACIÓN HUMANA EXTENDIDA (15-25 segundos) ──
                    // reCAPTCHA Enterprise analiza: tiempo en página, movimientos de mouse,
                    // scrolls, clics, hovers. Más interacción = mejor score.
                    const humanSimStart = Date.now();

                    // Fase 1: Scroll exploratorio (leer la página)
                    for (let i = 0; i < 3; i++) {
                        const scrollY = 100 + Math.random() * 400;
                        await page.evaluate((y: number) => window.scrollBy({ top: y, behavior: 'smooth' }), scrollY);
                        await page.waitForTimeout(1500 + Math.random() * 1500);

                        // Movimiento de mouse aleatorio mientras "lee"
                        const vw = 1920, vh = 1080;
                        for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) {
                            await page.mouse.move(
                                200 + Math.random() * (vw - 400),
                                200 + Math.random() * (vh - 400),
                                { steps: 8 + Math.floor(Math.random() * 12) }
                            );
                            await page.waitForTimeout(300 + Math.random() * 600);
                        }
                    }

                    // Fase 2: Hover sobre elementos interactivos (menú, links, etc.)
                    try {
                        const interactiveEls = await page.$$('a, button, select, label, span.ui-outputlabel');
                        const shuffled = interactiveEls.sort(() => Math.random() - 0.5).slice(0, 5);
                        for (const el of shuffled) {
                            try {
                                await el.hover();
                                await page.waitForTimeout(500 + Math.random() * 800);
                            } catch { /* elemento no visible, ignorar */ }
                        }
                    } catch { /* ignorar */ }

                    // Fase 3: Scroll de vuelta arriba (como si buscara el botón)
                    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
                    await page.waitForTimeout(1000 + Math.random() * 1000);

                    // Fase 4: Clic en algún lugar neutral (body) para activar focus
                    await page.mouse.click(500 + Math.random() * 200, 300 + Math.random() * 100);
                    await page.waitForTimeout(500 + Math.random() * 500);

                    const humanSimTime = ((Date.now() - humanSimStart) / 1000).toFixed(1);
                    console.log(`[SRI-ROBOT] ✅ Simulación humana completada (${humanSimTime}s de interacción)`);

                    // ── DIAGNÓSTICO reCAPTCHA Enterprise ──
                    const recaptchaDiag = await page.evaluate(() => {
                        const w = window as any;
                        return {
                            grecaptchaExists: typeof w.grecaptcha !== 'undefined',
                            enterpriseExists: typeof w.grecaptcha?.enterprise !== 'undefined',
                            enterpriseExecuteExists: typeof w.grecaptcha?.enterprise?.execute === 'function',
                            executeRecaptchaExists: typeof w.executeRecaptcha === 'function',
                            siteKey: '6LdukTQsAAAAAIcciM4GZq4ibeyplUhmWvlScuQE',
                        };
                    });
                    console.log('[SRI-ROBOT] 🔍 reCAPTCHA Enterprise:', JSON.stringify(recaptchaDiag));

                    // ── RETRY LOOP: intentar hasta 3 veces ──
                    const MAX_INTENTOS = 3;
                    let consultaExitosa = false;

                    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
                        console.log(`[SRI-ROBOT] 🔄 Intento ${intento}/${MAX_INTENTOS} de consulta...`);

                        // Scroll hacia el botón Consultar
                        await page.evaluate(() => {
                            const btn = document.querySelector('button[id*="btnBuscar"]');
                            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
                        await page.waitForTimeout(800 + Math.random() * 500);

                        const selBuscar = 'button[id*="btnBuscar"]';
                        await page.waitForSelector(selBuscar, { state: 'visible', timeout: 10000 });

                        // Movimiento de mouse natural hacia el botón
                        const btn = page.locator(selBuscar);
                        const box = await btn.boundingBox();
                        if (box) {
                            // Movimiento en arco (no línea recta)
                            const startX = box.x + Math.random() * 300 - 150;
                            const startY = box.y + Math.random() * 200 - 100;
                            await page.mouse.move(startX, startY, { steps: 6 });
                            await page.waitForTimeout(200 + Math.random() * 300);
                            await page.mouse.move(
                                box.x + box.width / 2 + (Math.random() * 6 - 3),
                                box.y + box.height / 2 + (Math.random() * 4 - 2),
                                { steps: 15 + Math.floor(Math.random() * 10) }
                            );
                            await page.waitForTimeout(800 + Math.random() * 600);
                        }

                        // Interceptar respuestas AJAX
                        let ajaxResponseReceived = false;
                        let ajaxResponseOk = false;
                        let captchaIncorrecta = false;
                        let ajaxResponseBody = '';

                        const responseHandler = async (response: any) => {
                            try {
                                const url = response.url();
                                if (url.includes('recaptcha') || url.includes('google.com/recaptcha')) {
                                    console.log(`[SRI-ROBOT] 🔒 reCAPTCHA: ${response.request().method()} ${url.substring(0, 100)} → ${response.status()}`);
                                }
                                if (url.includes('comprobantesRecibidos.jsf') && response.request().method() === 'POST') {
                                    ajaxResponseReceived = true;
                                    const status = response.status();
                                    if (status === 200) {
                                        const body = await response.text().catch(() => '');
                                        ajaxResponseBody = body;
                                        if (body.toLowerCase().includes('captcha incorrecta') || body.toLowerCase().includes('captcha incorrecto')) {
                                            captchaIncorrecta = true;
                                            console.log(`[SRI-ROBOT] ❌ CAPTCHA INCORRECTA detectada en AJAX response`);
                                        } else if (body.includes('tablaCompRecibidos') || body.includes('ui-datatable')) {
                                            ajaxResponseOk = true;
                                            console.log('[SRI-ROBOT] ✅ AJAX response contiene datos de tabla');
                                        }
                                    }
                                }
                            } catch { /* ignorar */ }
                        };

                        page.on('response', responseHandler);

                        // Click en Consultar
                        console.log('[SRI-ROBOT] Ejecutando click en Consultar...');
                        await page.click(selBuscar, { delay: 80 + Math.floor(Math.random() * 120) });

                        // Esperar respuesta AJAX (máx 20s)
                        for (let wait = 0; wait < 40; wait++) {
                            await page.waitForTimeout(500);
                            if (ajaxResponseReceived) break;
                        }

                        // Esperar un poco más para que la segunda respuesta AJAX llegue
                        await page.waitForTimeout(2000);

                        // Remover listener para el siguiente intento
                        page.removeListener('response', responseHandler);

                        // Verificar si la tabla de resultados apareció
                        const tablaVisible = await page.isVisible('[id="frmPrincipal:tablaCompRecibidos_data"]').catch(() => false);

                        // Verificar mensajes de error
                        const errorMsg = await page.evaluate(() => {
                            const warns = document.querySelectorAll('.ui-messages-warn, .ui-messages-error, .ui-message-error');
                            const msgs: string[] = [];
                            warns.forEach(m => { const t = m.textContent?.trim(); if (t) msgs.push(t); });
                            return msgs.length > 0 ? msgs.join(' | ') : null;
                        }).catch(() => null);

                        console.log(`[SRI-ROBOT] Intento ${intento} resultado: tabla=${tablaVisible}, ajaxOk=${ajaxResponseOk}, captchaError=${captchaIncorrecta}, errorMsg=${errorMsg || 'ninguno'}`);

                        if (tablaVisible && !captchaIncorrecta) {
                            console.log(`[SRI-ROBOT] ✅ Consulta exitosa en intento ${intento}!`);
                            consultaExitosa = true;
                            break;
                        }

                        if (captchaIncorrecta || (errorMsg && errorMsg.toLowerCase().includes('captcha'))) {
                            console.log(`[SRI-ROBOT] ⚠️ Captcha incorrecta en intento ${intento}. reCAPTCHA Enterprise dio score bajo.`);

                            if (intento < MAX_INTENTOS) {
                                // Esperar y simular más comportamiento humano antes del reintento
                                const waitTime = intento * 10; // 10s, 20s
                                console.log(`[SRI-ROBOT] ⏳ Esperando ${waitTime}s y simulando más interacción antes de reintentar...`);

                                // Limpiar el mensaje de error (clic en algún lugar)
                                await page.waitForTimeout(2000);

                                // Simulación humana entre reintentos
                                for (let k = 0; k < waitTime / 3; k++) {
                                    // Mouse movements
                                    await page.mouse.move(
                                        300 + Math.random() * 1200,
                                        200 + Math.random() * 600,
                                        { steps: 5 + Math.floor(Math.random() * 10) }
                                    );
                                    // Scroll aleatorio
                                    if (Math.random() > 0.5) {
                                        await page.evaluate(() => window.scrollBy({
                                            top: (Math.random() - 0.5) * 300,
                                            behavior: 'smooth'
                                        }));
                                    }
                                    await page.waitForTimeout(2000 + Math.random() * 2000);
                                }

                                // Scroll de vuelta al formulario
                                await page.evaluate(() => {
                                    const form = document.querySelector('[id="frmPrincipal"]');
                                    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                });
                                await page.waitForTimeout(1500);

                                // Re-habilitar botón si quedó deshabilitado
                                await page.evaluate(() => {
                                    const btn = document.querySelector('button[id*="btnBuscar"]') as HTMLButtonElement;
                                    if (btn && btn.disabled) {
                                        btn.disabled = false;
                                        btn.classList.remove('ui-state-disabled');
                                    }
                                });
                                await page.waitForTimeout(500);
                            }
                        } else if (!tablaVisible && !ajaxResponseOk) {
                            console.log(`[SRI-ROBOT] ⚠️ Sin tabla ni respuesta AJAX válida en intento ${intento}.`);
                            if (intento < MAX_INTENTOS) {
                                await page.waitForTimeout(5000);
                            }
                        } else {
                            // AJAX OK pero tabla no visible y no captcha error — esperar renderizado
                            console.log('[SRI-ROBOT] AJAX OK pero tabla no visible. Esperando renderizado...');
                            try {
                                await page.waitForSelector(
                                    '[id="frmPrincipal:tablaCompRecibidos_data"]',
                                    { state: 'attached', timeout: 10000 }
                                );
                                const tablaAhora = await page.isVisible('[id="frmPrincipal:tablaCompRecibidos_data"]').catch(() => false);
                                if (tablaAhora) {
                                    console.log('[SRI-ROBOT] ✅ Tabla apareció tras espera de renderizado.');
                                    consultaExitosa = true;
                                    break;
                                }
                            } catch {
                                console.log('[SRI-ROBOT] Tabla no apareció tras espera adicional.');
                            }
                        }
                    }

                    // DEBUG: Capturar estado final
                    try {
                        const fs = eval("require")('fs');
                        const path = eval("require")('path');
                        const timestamp = Date.now();
                        await page.screenshot({ path: path.resolve(`sri_after_consultar_${timestamp}.png`), fullPage: true });
                        const html = await page.content();
                        fs.writeFileSync(path.resolve(`sri_after_consultar_${timestamp}.html`), html);
                        console.log(`[SRI-ROBOT] DEBUG: Dump post-consultar guardado (timestamp: ${timestamp})`);
                    } catch (e) {
                        console.error('[SRI-ROBOT] Error guardando dump post-consultar:', e);
                    }

                    // Si después de todos los intentos no funcionó → fallback manual
                    if (!consultaExitosa) {
                        console.log('[SRI-ROBOT] ❌ reCAPTCHA Enterprise rechazó todos los intentos automáticos.');
                        console.log('[SRI-ROBOT] 💡 Modo manual: El navegador está abierto. Tienes 3 minutos para:');
                        console.log('[SRI-ROBOT]    1. Hacer clic en "Consultar" manualmente');
                        console.log('[SRI-ROBOT]    2. Esperar a que aparezca la tabla de resultados');
                        console.log('[SRI-ROBOT] Esperando tabla de resultados...');

                        try {
                            await page.waitForSelector(
                                '[id="frmPrincipal:tablaCompRecibidos_data"] tr',
                                { state: 'attached', timeout: 180000 }
                            );
                            console.log('[SRI-ROBOT] ✅ Tabla detectada después de intervención manual.');
                        } catch {
                            console.error('[SRI-ROBOT] ❌ Timeout: No se detectaron resultados en 3 minutos.');
                            try {
                                const fs = eval("require")('fs');
                                const path = eval("require")('path');
                                const ts = Date.now();
                                await page.screenshot({ path: path.resolve(`sri_captcha_timeout_${ts}.png`), fullPage: true });
                            } catch { }
                            throw new Error(
                                'reCAPTCHA Enterprise del SRI bloqueó la consulta automática tras 3 intentos. ' +
                                'El navegador se abrió para resolución manual pero no se completó a tiempo.'
                            );
                        }
                    }

                    console.log('[SRI-ROBOT] ✅ Tabla de resultados visible. Continuando con descarga...');
                    await page.waitForTimeout(1000);

                } catch (navError: any) {
                    console.error('[SRI-ROBOT] Error en navegación/filtros:', navError);

                    // Dump para debug
                    try {
                        const fs = eval("require")('fs');
                        const path = eval("require")('path');
                        const timestamp = Date.now();
                        const debugHtml = await page.content();
                        const debugFile = path.resolve(`sri_robot_debug_error_${timestamp}.html`);
                        const debugPng = path.resolve(`sri_robot_debug_error_${timestamp}.png`);

                        fs.writeFileSync(debugFile, debugHtml);
                        await page.screenshot({ path: debugPng, fullPage: true });
                        console.log(`[SRI-ROBOT] Dump guardado en: ${debugFile} y ${debugPng}`);
                    } catch (dumpErr) {
                        console.error('[SRI-ROBOT] No se pudo guardar dump:', dumpErr);
                    }
                    throw navError;
                }

                // 7. Extraer resultados de la tabla
                console.log('[SRI-ROBOT] Buscando resultados en la tabla...');

                const tableBodySelector = '[id="frmPrincipal:tablaCompRecibidos_data"]';
                try {
                    await page.waitForSelector(tableBodySelector, { state: 'attached', timeout: 30000 });
                    console.log('[SRI-ROBOT] Contenedor de datos detectado.');
                } catch (e) {
                    console.log('[SRI-ROBOT] ALERTA: No se detectó el contenedor de datos (timeout).');
                }

                const selectorFilas = `${tableBodySelector} tr, tbody.ui-datatable-data tr, tr.ui-widget-content`;
                const todasFilas = await page.$$(selectorFilas);

                totalEncontrados = todasFilas.length;
                console.log(`[SRI-ROBOT] Filas encontradas: ${totalEncontrados}`);

                // DEBUG: Si no hay filas
                if (totalEncontrados === 0) {
                    console.log('[SRI-ROBOT] 0 filas encontradas. Diagnóstico:');
                    try {
                        const table = await page.$('[id="frmPrincipal:tablaCompRecibidos"]');
                        if (table) {
                            console.log('[SRI-ROBOT] La tabla padre existe.');
                            const html = await table.innerHTML();
                            console.log('[SRI-ROBOT] HTML parcial:', html.substring(0, 500) + '...');
                        } else {
                            console.log('[SRI-ROBOT] No se encontró la tabla padre.');
                        }

                        const fs = eval("require")('fs');
                        const path = eval("require")('path');
                        const timestamp = Date.now();
                        const debugPng = path.resolve(`sri_debug_table_${timestamp}.png`);
                        await page.screenshot({ path: debugPng, fullPage: true });
                        console.log(`[SRI-ROBOT] Screenshot guardado en: ${debugPng}`);
                    } catch (e) {
                        console.log('[SRI-ROBOT] Error en diagnóstico:', e);
                    }
                }

                // Aplicar rango manual si se especificó
                const desde = registroDesde ? Math.max(0, registroDesde - 1) : 0;
                const hasta = registroHasta ? Math.min(todasFilas.length, registroHasta) : todasFilas.length;
                const filas = todasFilas.slice(desde, hasta);
                console.log(`[SRI-ROBOT] Procesando rango ${desde + 1} a ${hasta} (${filas.length} items)`);

                // Actualizar total encontrados
                await db.query(
                    {
                        text: `UPDATE compras.descargas_robot SET total_encontrados = $1, updated_at = NOW() WHERE id = $2`,
                        values: [totalEncontrados, descargaId]
                    },
                    { empresaId, usuarioId }
                );

                // 8. Procesar cada comprobante
                for (let i = 0; i < filas.length; i++) {
                    try {
                        const fila = filas[i];
                        const celdas = await fila.$$('td');

                        if (celdas.length < 9) {
                            console.log(`[SRI-ROBOT] Fila ${i} ignorada (celdas insuficientes: ${celdas.length})`);
                            continue;
                        }

                        const colRucRazon = await celdas[1]?.textContent() || '';
                        const colTipoNumero = await celdas[2]?.textContent() || '';
                        const colClave = await celdas[3]?.textContent() || '';
                        const colFechaEmision = await celdas[5]?.textContent() || '';
                        const colMontoTotal = await celdas[8]?.textContent() || '0';

                        // Parsear RUC y Razón Social
                        let rucEmisor = '';
                        let razonSocial = '';
                        const rucMatch = colRucRazon.trim().match(/^(\d{13})(\s+)(.+)/s);
                        if (rucMatch) {
                            rucEmisor = rucMatch[1];
                            razonSocial = rucMatch[3].trim();
                        } else {
                            rucEmisor = colRucRazon.trim().substring(0, 13);
                            razonSocial = colRucRazon.trim().substring(13).trim();
                        }

                        // Parsear Tipo y Numero
                        let tipoComp = '';
                        let numero = '';
                        const tipoMatch = colTipoNumero.trim().match(/^([^\d]+)(\s+)(\d{3}-\d{3}-\d{9})/);
                        if (tipoMatch) {
                            tipoComp = tipoMatch[1].trim();
                            numero = tipoMatch[3].trim();
                        } else {
                            tipoComp = colTipoNumero.replace(/\d{3}-\d{3}-\d{9}/, '').trim();
                            const numMatch = colTipoNumero.match(/\d{3}-\d{3}-\d{9}/);
                            numero = numMatch ? numMatch[0] : '';
                        }

                        const claveAcceso = colClave.trim();
                        const fechaEmision = colFechaEmision.trim();

                        if (i % 5 === 0) console.log(`[SRI-ROBOT] Procesando item ${i + 1}/${filas.length}: ${claveAcceso}`);

                        // Verificar si ya existe
                        const existeResult = await db.query(
                            {
                                text: `SELECT id FROM compras.comprobantes_descargados WHERE empresa_id = $1 AND clave_acceso = $2`,
                                values: [empresaId, claveAcceso]
                            },
                            { empresaId, usuarioId }
                        );

                        if (existeResult.rows.length > 0) {
                            continue;
                        }

                        // Descargar XML
                        let xmlContenido = '';
                        try {
                            if (claveAcceso.length === 49) {
                                xmlContenido = await this.descargarXmlPorClaveAcceso(claveAcceso);
                            }
                        } catch (xmlErr: any) {
                            console.error(`[SRI-ROBOT] Error descarga XML ${claveAcceso}: ${xmlErr.message}`);
                            errores.push(`Error XML clave ${claveAcceso}: ${xmlErr.message}`);
                        }

                        // Mapear tipo de comprobante
                        const tipoCompMap: Record<string, string> = {
                            'FACTURA': '01',
                            'NOTA DE CRÉDITO': '04',
                            'NOTA DE DÉBITO': '05',
                            'COMPROBANTE DE RETENCIÓN': '07',
                            'GUÍA DE REMISIÓN': '06',
                            'LIQUIDACIÓN DE COMPRA': '03'
                        };
                        const tipoNormalizado = tipoComp.toUpperCase().replace('É', 'E');
                        const tipoCompCodigo = tipoCompMap[tipoNormalizado] || '01';

                        // Guardar comprobante
                        await db.query(
                            {
                                text: `INSERT INTO compras.comprobantes_descargados 
                                    (empresa_id, descarga_id, clave_acceso, tipo_comprobante, ruc_emisor, razon_social_emisor, 
                                     numero_comprobante, fecha_emision, monto_total, xml_contenido, estado)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'NUEVO')
                                    ON CONFLICT (empresa_id, clave_acceso) DO NOTHING`,
                                values: [
                                    empresaId, descargaId, claveAcceso, tipoCompCodigo,
                                    rucEmisor, razonSocial, numero,
                                    this.parseFechaSri(fechaEmision),
                                    parseFloat(colMontoTotal.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0,
                                    xmlContenido
                                ]
                            },
                            { empresaId, usuarioId }
                        );

                        totalDescargados++;

                        // Actualizar progreso
                        if (totalDescargados % 5 === 0) {
                            await db.query(
                                {
                                    text: `UPDATE compras.descargas_robot SET total_descargados = $1, updated_at = NOW() WHERE id = $2`,
                                    values: [totalDescargados, descargaId]
                                },
                                { empresaId, usuarioId }
                            );
                        }
                    } catch (filaErr: any) {
                        console.error(`[SRI-ROBOT] Error fila ${i}: ${filaErr.message}`);
                        errores.push(`Error fila ${i}: ${filaErr.message}`);
                    }
                }

            } finally {
                console.log('[SRI-ROBOT] Cerrando navegador');
                await browser.close();
            }

            // 9. Marcar descarga como COMPLETADO
            console.log(`[SRI-ROBOT] Completado. Total: ${totalEncontrados}, Descargados: ${totalDescargados}, Errores: ${errores.length}`);
            await db.query(
                {
                    text: `UPDATE compras.descargas_robot 
                        SET estado = 'COMPLETADO', total_descargados = $1, fecha_fin = NOW(), 
                            error_detalle = $2, updated_at = NOW() 
                        WHERE id = $3`,
                    values: [totalDescargados, errores.length > 0 ? errores.join('\n') : null, descargaId]
                },
                { empresaId, usuarioId }
            );

        } catch (error: any) {
            console.error('[SRI-ROBOT] FATAL ERROR:', error);

            let mensajeUsuario = error.message;

            // Personalizar mensajes de error comunes
            if (error.message.includes('Timeout') && error.message.includes('exceeded')) {
                mensajeUsuario = 'El portal del SRI no responde (Timeout). Es posible que esté caído o muy lento. Intente más tarde.';
            } else if (error.message.includes('net::ERR_CONNECTION_TIMED_OUT') || error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                mensajeUsuario = 'No hay conexión con el SRI. Verifique su internet o si el sitio del SRI está accessible.';
            } else if (error.message.includes('No se pudo salir de la página de login')) {
                mensajeUsuario = 'Credenciales SRI incorrectas o el sistema requiere cambio de clave. Ingrese manualmente al SRI para verificar.';
            }

            await db.query(
                {
                    text: `UPDATE compras.descargas_robot SET estado = 'ERROR', error_detalle = $1, fecha_fin = NOW(), updated_at = NOW() WHERE id = $2`,
                    values: [mensajeUsuario, descargaId]
                },
                { empresaId, usuarioId }
            );
            errores.push(mensajeUsuario);
        }

        return { total: totalEncontrados, descargados: totalDescargados, errores };
    }

    /**
     * Simula comportamiento humano para evadir detección de bots
     */
    static async simularComportamientoHumano(page: any): Promise<void> {
        console.log('[SRI-ROBOT] Simulando comportamiento humano...');

        // 1. Movimientos de mouse aleatorios naturales
        for (let i = 0; i < 2; i++) {
            const x = Math.random() * 600 + 100;
            const y = Math.random() * 400 + 100;
            await page.mouse.move(x, y, { steps: 15 + Math.floor(Math.random() * 10) });
            await page.waitForTimeout(200 + Math.random() * 300);
        }

        // 2. Scroll natural
        await page.evaluate(() => {
            window.scrollTo({
                top: 200,
                behavior: 'smooth'
            });
        });
        await page.waitForTimeout(100);

        await page.evaluate(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        await page.waitForTimeout(200);

        // 3. Hover sobre elementos
        try {
            const elementos = await page.$$('a, button, input');
            if (elementos.length > 0) {
                const randomEl = elementos[Math.floor(Math.random() * Math.min(elementos.length, 5))];
                await randomEl.hover();
                await page.waitForTimeout(300 + Math.random() * 400);
            }
        } catch (e) {
            // Ignorar
        }

        // 4. Simular lectura
        await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // NOTA: La función ocultarAutomacion() ha sido reemplazada por el plugin
    // puppeteer-extra-plugin-stealth que se aplica automáticamente al chromium.
    // El stealth plugin parchea 12+ indicadores de forma más robusta:
    // - navigator.webdriver
    // - chrome.runtime 
    // - navigator.plugins (con array realista, no [1,2,3,4,5])
    // - navigator.languages
    // - navigator.permissions.query
    // - window.chrome
    // - WebGL vendor/renderer
    // - HeadlessChrome User-Agent
    // - Y más...
    /**
     * Descarga XML de un comprobante por clave de acceso
     */
    static async descargarXmlPorClaveAcceso(claveAcceso: string): Promise<string> {
        const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
            <soapenv:Body>
                <ec:autorizacionComprobante>
                    <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
                </ec:autorizacionComprobante>
            </soapenv:Body>
        </soapenv:Envelope>`;

        const ambiente = claveAcceso.length >= 24 ? claveAcceso[23] : '2';
        const url = ambiente === '1'
            ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
            : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/xml; charset=utf-8' },
            body: soapBody
        });

        const responseText = await response.text();

        const comprobanteMatch = responseText.match(/<comprobante><!\[CDATA\[([\s\S]*?)\]\]><\/comprobante>/);
        if (comprobanteMatch && comprobanteMatch[1]) {
            return comprobanteMatch[1];
        }

        const altMatch = responseText.match(/<comprobante>([\s\S]*?)<\/comprobante>/);
        if (altMatch && altMatch[1]) {
            return altMatch[1];
        }

        return '';
    }

    /**
     * Convierte fecha DD/MM/YYYY a YYYY-MM-DD
     */
    static parseFechaSri(fechaStr: string): string {
        if (!fechaStr) return new Date().toISOString().split('T')[0];
        const parts = fechaStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return fechaStr;
    }
}