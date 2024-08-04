export default function CalcularSubtotal(cantidad, precioUnitario, descuento) {
    if (descuento < cantidad * precioUnitario) {
        return (cantidad * precioUnitario) - descuento
    }

    return 0
}
