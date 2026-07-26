const fs = require('fs');

async function checkAPI() {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
    const token = process.env.API_TOKEN || process.env.NEXT_PUBLIC_API_TOKEN;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.sandbox.wisefacturacion.com';

    // Since I don't know an exact ID, I'll fetch ListarFacturas first
    const listRes = await fetch(`${apiUrl}/api/facturas/ListarFacturas`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    console.log(JSON.stringify(listData, null, 2).substring(0, 1000));
}

checkAPI();
