const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('NAVEGADOR ERROR:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('NAVEGADOR EXCEPCIÓN:', error.message);
    });

    await page.goto('http://localhost:3001/Cobranza/Alumnos', { waitUntil: 'load', timeout: 60000 });
    console.log("Pagina cargada.");
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    const clickResult = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('p, span, td, div'));
        const target = nodes.find(n => n.style.cursor === 'pointer' && n.style.textDecoration === 'underline');
        if (target) {
            target.click();
            return true;
        }
        return false;
    });
    
    console.log('Clic hecho:', clickResult);
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('Hecho.');
    await browser.close();
})();
