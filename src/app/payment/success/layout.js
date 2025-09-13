export const metadata = {
  title: "Pago Exitoso - Wise Factura",
  description: "Tu pago se ha procesado correctamente"
};

export default function SuccessLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}