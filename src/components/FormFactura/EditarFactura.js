const apiUrl = process.env.NEXT_PUBLIC_API_URL;
export default async function GuardarFactura(factura, onSuccess, onError, {token}) {
    try {
        console.log("factura",factura);
            // Continúa con el uso de token 
            const response = await fetch(`${apiUrl}/api/facturas/EditarFactura`, {
                method: 'PUT',
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
            console.log('Factura actualizada con éxito:', result);
            onSuccess('Factura actualizada con éxito'); // Llama al callback de éxito
        
    } catch (error) {
        console.error('Error al enviar la factura:', error);
        onError('Error al actualizar la factura'); // Llama al callback de error
    }
}