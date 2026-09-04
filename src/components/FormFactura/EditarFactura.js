const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Sanitizar campos vacíos para evitar errores de validación en importes o tipos en Go
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
    if (copia.Conceptos) {
        if (copia.Conceptos.TotalImpuestosTrasladadosString === undefined || copia.Conceptos.TotalImpuestosTrasladadosString === null) {
            copia.Conceptos.TotalImpuestosTrasladadosString = "0.00";
        }
        if (copia.Conceptos.TotalImpuestosRetenidosString === undefined || copia.Conceptos.TotalImpuestosRetenidosString === null) {
            copia.Conceptos.TotalImpuestosRetenidosString = "0.00";
        }

        if (copia.Conceptos.ListaConceptos && Array.isArray(copia.Conceptos.ListaConceptos)) {
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
                        if (traslado.TasaOCuotaString === undefined || traslado.TasaOCuotaString === null || String(traslado.TasaOCuotaString).trim() === "") {
                            traslado.TasaOCuotaString = "0.160000";
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
                        if (retencion.TasaOCuotaString === undefined || retencion.TasaOCuotaString === null || String(retencion.TasaOCuotaString).trim() === "") {
                            retencion.TasaOCuotaString = "0.000000";
                        }
                        return retencion;
                    });
                }

                return concepto;
            });
        }
    }

    return copia;
};

export default async function GuardarFactura(factura, onSuccess, onError, { token }) {
    try {
        const payloadSanitizado = sanitizarFactura(factura);
        console.log("GuardarFactura (edición Go) payload:", payloadSanitizado);

        const targetUrl = `${apiUrl || ''}/api/facturas/EditarFactura`;
        console.log("Enviando PUT EditarFactura a:", targetUrl);

        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payloadSanitizado)
        });

        if (!response.ok) {
            let errorMensaje = 'Error al actualizar la factura';
            try {
                const errorData = await response.json();
                errorMensaje = errorData.Error || errorData.error || errorData.mensaje || errorData.message || JSON.stringify(errorData);
            } catch {
                const text = await response.text();
                if (text) errorMensaje = text;
            }
            console.error("Error devuelto por la API Go EditarFactura:", response.status, errorMensaje);
            throw new Error(errorMensaje);
        }

        const result = await response.json();
        console.log("Respuesta exitosa de EditarFactura:", result);
        const mensajeExito = result.mensaje || result.Mensaje || result.message || 'Factura actualizada con éxito';
        onSuccess(mensajeExito);

    } catch (error) {
        console.error('Error al actualizar la factura:', error);
        onError(error.message || 'Error al actualizar la factura');
    }
}