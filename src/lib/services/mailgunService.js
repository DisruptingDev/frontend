export async function sendEmailViaMailgun({ to, subject, html, attachments = [], from, replyTo }) {
    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;
    
    // Si no están configuradas las variables de Mailgun, devolvemos un error claro
    if (!domain || !apiKey) {
        throw new Error('MAILGUN_DOMAIN o MAILGUN_API_KEY no están configurados en el archivo .env');
    }

    // Configuramos el remitente por defecto si no viene especificado
    const defaultFrom = `Cobranza Institucional <pagos@${domain}>`;
    const finalFrom = from || defaultFrom;

    const formData = new FormData();
    formData.append('from', finalFrom);
    formData.append('to', to);
    if (replyTo) {
        formData.append('h:Reply-To', replyTo);
    }
    formData.append('subject', subject);
    formData.append('html', html);

    // Procesamos adjuntos (crear instancia File para garantizar serialización multipart en Node/Mailgun)
    if (attachments && attachments.length > 0) {
        for (const att of attachments) {
            const buf = Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content);
            const file = new File([buf], att.filename, { type: att.contentType || 'application/octet-stream' });
            console.log(`[Mailgun] Adjuntando archivo: ${att.filename} (${buf.length} bytes, tipo: ${att.contentType})`);
            formData.append('attachment', file);
        }
    }

    const credentials = Buffer.from(`api:${apiKey}`).toString('base64');

    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`
        },
        body: formData
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error en la API de Mailgun (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return data;
}
