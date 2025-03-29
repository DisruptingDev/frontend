export const metadata = {
  title: "Comprar timbres",
  description: "Compara timbres para tus documentos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Agregamos el script de Openpay */}
        <script
          type="text/javascript"
          src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"
        ></script>
        <script
          type="text/javascript"
          src="https://js.openpay.mx/openpay.v1.min.js"
        ></script>
        <script
          type="text/javascript"
          src="https://js.openpay.mx/openpay-data.v1.min.js"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
