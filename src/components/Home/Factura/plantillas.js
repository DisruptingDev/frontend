// plantillas.js
export const plantillas = {
    facturaBasica: `
      <style>
        body { font-family: Arial, sans-serif; }
        h1 { font-size: 16pt; margin-bottom: 10px; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
      <div>
        <h1>Factura Básica</h1>
        <p><strong>Versión:</strong> {{Version}}</p>
        <p><strong>Serie:</strong> {{Serie}}</p>
        <p><strong>Folio:</strong> {{Folio}}</p>
        <p><strong>Fecha:</strong> {{Fecha}}</p>
        <p><strong>Forma de Pago:</strong> {{FormaPago}}</p>
        <p><strong>Condiciones de Pago:</strong> {{CondicionesDePago}}</p>
        <p><strong>SubTotal:</strong> {{SubTotal}} {{Moneda}}</p>
        <p><strong>Total:</strong> {{Total}} {{Moneda}}</p>
        <p><strong>Lugar de Expedición:</strong> {{LugarExpedicion}}</p>
      </div>
    `,
    // Otras plantillas...
  };
  