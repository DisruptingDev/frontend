export const metadata = {
  title: "Pago Cancelado - Wise Factura",
  description: "Has cancelado el proceso de pago"
};

export default function CancelLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}