// En Vercel Serverless, simular el runtime de AWS Lambda Node 20 para que @sparticuz/chromium
// extraiga automáticamente las dependencias del sistema (al2023.tar.br que contiene libnss3.so)
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    process.env.AWS_EXECUTION_ENV = process.env.AWS_EXECUTION_ENV || 'AWS_Lambda_nodejs20.x';
    process.env.AWS_LAMBDA_JS_RUNTIME = process.env.AWS_LAMBDA_JS_RUNTIME || 'nodejs20.x';
}

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

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
        // En Vercel, buscar si la carpeta bin fue copiada o ubicada en node_modules
        const possibleBinPaths = [
            path.join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin'),
            path.join(__dirname, '..', '..', '..', 'node_modules', '@sparticuz', 'chromium', 'bin'),
            '/var/task/node_modules/@sparticuz/chromium/bin'
        ];

        let binDir = null;
        for (const p of possibleBinPaths) {
            if (fs.existsSync(p)) {
                binDir = p;
                break;
            }
        }

        const execPath = binDir ? await chromium.executablePath(binDir) : await chromium.executablePath();
        
        // Asegurar que el cargador dinámico de Linux busque librerías en /tmp y /tmp/al2023/lib
        const libPaths = ['/tmp/al2023/lib', '/tmp/al2/lib', '/tmp'];
        const existingLd = process.env.LD_LIBRARY_PATH ? process.env.LD_LIBRARY_PATH.split(':') : [];
        process.env.LD_LIBRARY_PATH = [...new Set([...libPaths, ...existingLd])].join(':');

        return execPath;
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
            
            if (isProduction) {
                chromium.setHeadlessMode = true;
                chromium.setGraphicsMode = false;
            }

            const executablePath = await resolveExecutablePath();

            browserInstance = await puppeteer.launch({
                args: isProduction
                    ? [
                        ...chromium.args,
                        '--disable-gpu',
                        '--disable-dev-shm-usage',
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ]
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
