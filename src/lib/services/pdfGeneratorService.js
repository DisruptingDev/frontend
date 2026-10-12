import puppeteer from 'puppeteer';

let browserInstance = null;
let browserLaunchingPromise = null;
let idleTimeout = null;

const IDLE_TIME_MS = 60000; // Cerrar Chromium si pasa 1 minuto sin solicitudes para liberar RAM

function resetIdleTimer() {
    if (idleTimeout) {
        clearTimeout(idleTimeout);
    }
    idleTimeout = setTimeout(async () => {
        if (browserInstance) {
            try {
                await browserInstance.close();
            } catch (e) {
                // Ignore close error
            }
            browserInstance = null;
        }
    }, IDLE_TIME_MS);
}

/**
 * Obtiene o inicializa una instancia compartida (singleton) de Puppeteer
 * para evitar sobrecarga de memoria y arranque de procesos por cada factura.
 */
async function getBrowser() {
    if (browserInstance && browserInstance.connected) {
        resetIdleTimer();
        return browserInstance;
    }

    if (browserLaunchingPromise) {
        return browserLaunchingPromise;
    }

    browserLaunchingPromise = (async () => {
        try {
            browserInstance = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-extensions'
                ]
            });

            browserInstance.on('disconnected', () => {
                browserInstance = null;
                browserLaunchingPromise = null;
                if (idleTimeout) clearTimeout(idleTimeout);
            });

            resetIdleTimer();
            return browserInstance;
        } finally {
            browserLaunchingPromise = null;
        }
    })();

    return browserLaunchingPromise;
}

/**
 * Convierte código HTML a un Buffer PDF usando Puppeteer
 * @param {string} html Código HTML completo
 * @param {object} options Opciones de formato de página
 * @returns {Promise<Buffer>}
 */
export async function generarPdfDesdeHtml(html, options = {}) {
    let page = null;
    try {
        const browser = await getBrowser();
        page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        // Esperar un breve momento para renderizar fuentes y estilos CSS
        await new Promise(resolve => setTimeout(resolve, 80));

        const pdfBuffer = await page.pdf({
            format: options.format || 'Letter',
            printBackground: true,
            margin: {
                top: options.marginTop || '10mm',
                bottom: options.marginBottom || '10mm',
                left: options.marginLeft || '10mm',
                right: options.marginRight || '10mm'
            }
        });

        resetIdleTimer();
        return Buffer.from(pdfBuffer);
    } catch (error) {
        console.error('Error generando PDF con Puppeteer:', error);
        throw error;
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                // Ignore page close errors
            }
        }
    }
}
