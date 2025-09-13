'use client'; // Necesario porque PayPalScriptProvider es un componente cliente

import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const initialOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  currency: "MXN",
  intent: "capture",
  locale: "es_MX",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>Comprar timbres</title>
        <meta name="description" content="Compara timbres para tus documentos" />
      </head>
      <body>
        <PayPalScriptProvider options={initialOptions}>
          {children}
        </PayPalScriptProvider>
      </body>
    </html>
  );
}
