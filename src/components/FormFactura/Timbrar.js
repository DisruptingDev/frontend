export default async function GuardarFactura(factura, onSuccess, onError ,{token}) {
    try {
        console.log("factura",factura);
      
           
            const response = await fetch('http://31.220.31.152:8087/GuardarFactura', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(factura)
            });

            if (!response.ok) {
                throw new Error('Error al guardar la factura');
            }

            const result = await response.json();
            console.log('Factura creada con éxito:', result);
            onSuccess('Factura creada con éxito'); // Llama al callback de éxito

    } catch (error) {
        console.error('Error al enviar la factura:', error);
        onError('Error al enviar la factura'); // Llama al callback de error
    }
}