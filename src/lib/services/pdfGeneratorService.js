import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';

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
 * Obtiene la ruta ejecutable de Chrome/Chromium según el entorno:
 * - En producción (Vercel/Serverless): usa el binario ligero @sparticuz/chromium.
 * - En desarrollo local (Windows/Mac/Linux): busca Chrome/Edge instalado o variable de entorno.
 */
async function resolveExecutablePath() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    if (isProduction) {
        return await chromium.executablePath();
    }

    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    for (const path of commonPaths) {
        if (fs.existsSync(path)) {
            return path;
        }
    }

    // Fallback a chromium si está disponible
    return await chromium.executablePath();
}

/**
 * Obtiene o inicializa una instancia de Puppeteer
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
            const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
            const executablePath = await resolveExecutablePath();

            browserInstance = await puppeteer.launch({
                args: isProduction
                    ? chromium.args
                    : [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-first-run',
                        '--disable-extensions'
                    ],
                defaultViewport: chromium.defaultViewport,
                executablePath,
                headless: isProduction ? chromium.headless : 'new'
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
