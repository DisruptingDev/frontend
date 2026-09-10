const apiUrl = process.env.NEXT_PUBLIC_API_URL;
export default async function GuardarFactura(factura, onSuccess, onError ,{token}) {

    try {
        console.log("factura",factura);
      
           
            // Sanitizar campos vacíos para evitar errores de validación de importes vacíos en el SAT
            const sanitizarFactura = (f) => {
                const copia = JSON.parse(JSON.stringify(f));
                
                // Comprobante global
                if (copia.DescuentoString === undefined || copia.DescuentoString === null || String(copia.DescuentoString).trim() === "") {
                    copia.DescuentoString = "0.00";
                }
                if (copia.SubTotalString === undefined || copia.SubTotalString === null || String(copia.SubTotalString).trim() === "") {
                    copia.SubTotalString = "0.00";
                }
                if (copia.TotalString === undefined || copia.TotalString === null || String(copia.TotalString).trim() === "") {
                    copia.TotalString = "0.00";
                }

                // Conceptos
                if (copia.Conceptos && copia.Conceptos.ListaConceptos && Array.isArray(copia.Conceptos.ListaConceptos)) {
                    copia.Conceptos.ListaConceptos = copia.Conceptos.ListaConceptos.map(concepto => {
                        if (concepto.DescuentoString === undefined || concepto.DescuentoString === null || String(concepto.DescuentoString).trim() === "") {
                            concepto.DescuentoString = "0.00";
                        }
                        if (concepto.ImporteString === undefined || concepto.ImporteString === null || String(concepto.ImporteString).trim() === "") {
                            concepto.ImporteString = "0.00";
                        }
                        if (concepto.ValorUnitarioString === undefined || concepto.ValorUnitarioString === null || String(concepto.ValorUnitarioString).trim() === "") {
                            concepto.ValorUnitarioString = "0.00";
                        }

                        // Traslados del concepto
                        if (concepto.Impuestos && concepto.Impuestos.Traslados && Array.isArray(concepto.Impuestos.Traslados)) {
                            concepto.Impuestos.Traslados = concepto.Impuestos.Traslados.map(traslado => {
                                if (traslado.ImporteString === undefined || traslado.ImporteString === null || String(traslado.ImporteString).trim() === "") {
                                    traslado.ImporteString = "0.00";
                                }
                                if (traslado.BaseString === undefined || traslado.BaseString === null || String(traslado.BaseString).trim() === "") {
                                    traslado.BaseString = "0.00";
                                }
                                return traslado;
                            });
                        }

                        // Retenciones del concepto
                        if (concepto.Impuestos && concepto.Impuestos.Retenciones && Array.isArray(concepto.Impuestos.Retenciones)) {
                            concepto.Impuestos.Retenciones = concepto.Impuestos.Retenciones.map(retencion => {
                                if (retencion.ImporteString === undefined || retencion.ImporteString === null || String(retencion.ImporteString).trim() === "") {
                                    retencion.ImporteString = "0.00";
                                }
                                if (retencion.BaseString === undefined || retencion.BaseString === null || String(retencion.BaseString).trim() === "") {
                                    retencion.BaseString = "0.00";
                                }
                                return retencion;
                            });
                        }

                        return concepto;
                    });
                }

                return copia;
            };

            const payloadSanitizado = sanitizarFactura(factura);
            console.log("Payload Sanitizado:", payloadSanitizado);

            const response = await fetch(`${apiUrl}/api/facturas/GuardarFactura`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadSanitizado)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error devuelto por la API:", errorText);
                throw new Error(`Error al guardar la factura: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('Factura creada con éxito en Go API:', result);

            // Sincronizar impuestos locales si están presentes
            const imploc = factura.Complemento?.ImpuestosLocales || factura.ImpuestosLocales || factura.impuestosLocales || [];
            const hasLocalTaxes = Array.isArray(imploc) 
                ? imploc.length > 0 
                : ((imploc?.TrasladosLocales && imploc.TrasladosLocales.length > 0) || (imploc?.RetencionesLocales && imploc.RetencionesLocales.length > 0));

            if (hasLocalTaxes) {
                try {
                    await fetch('/api/facturas/ImpuestosLocales/guardar', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            comprobante_id: result?.ID || result?.id || result?.Comprobante?.ID || result?.comprobante_id,
                            serie: payloadSanitizado.Serie,
                            folio: payloadSanitizado.Folio,
                            emisor_id: payloadSanitizado.EmisorID,
                            impuestosLocales: imploc
                        })
                    });
                } catch (errLoc) {
                    console.warn("Advertencia al guardar impuestos locales de nueva factura:", errLoc);
                }
            }

            const mensajeExito = result?.mensaje || result?.Mensaje || result?.message || 'Factura creada con éxito';
            onSuccess(mensajeExito); // Llama al callback de éxito

    } catch (error) {
        console.error('Error al enviar la factura:', error);
        onError('Error al enviar la factura'); // Llama al callback de error
    }
}