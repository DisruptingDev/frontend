"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

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
        <title>Wise Factura</title>
        <meta
          name="description"
          content="Facturación electrónica fácil y rápida"
        />
      </head>
      <PayPalScriptProvider options={initialOptions}>
        {children}
      </PayPalScriptProvider>
    </html>
  );
}
