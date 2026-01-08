import './globals.css'; // Importa tus estilos globales
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'

export const metadata = {
  title: 'Facturación en Línea CFDI 4.0 | Wise Facturación México',
  description: 'Genera tus facturas electrónicas de forma simple, rápida y segura. Cumplimiento total con el SAT, timbrado masivo y soporte técnico. ¡Prueba Wise Facturación hoy!',
  keywords: [
    'facturación en línea',
    'facturación electrónica',
    'proveedor de timbrado masivo México',
    'plataforma de facturación económica',
    'facturación electrónica multi-RFC',
    'facturación electrónica multi-RFC',
    'sistema de facturación en línea',
    'facture',
    'facturacion electronica',
    'facturación electrónica',
    'programa de facturacion',
    'hacer factura online',
    'factura online',
    'sistema de facturacion electronica',
    'sistema de facturacion electronica',
    'crear factura',
    'software facturacion',
    'programa facturacion autonomo',
    'programa de facturacion electronica',
    'generar factura',
    'facturas gratis online',
    'sistema facturacion',
    'facturar ticket',
    'cfdi nómina',
    'cfdi sat',
    'sistema de facturacion 4.0',
    'factupronto 4.0',
    'realizar factura electronica gratis',
    'sistema para facturar',
    'facturacion para PYMES',
    'generar factura gratis',
    'realizar facturas electronicas',
    'facturacion de fasolina',
    'sistema de facturacion electronica',
    'wise factura',
    'wise facturacion',
    'wise facturacion electronica',
    'wise sistema de facturacion',
    'wise sistema de facturacion electronica',
    'wise sistema de facturacion electronica',
    'wise sistema de facturacion electronica',
    'wise factura'
  ],
  openGraph: {
    title: 'Wise facturacion - Facturacion electronica a la medida',
    description: 'Factura de manera facil, rapida y segura con nuestro sistema web, descubre los beneficiosde facturar con nosotros y ahora tiempo en tus proscesos',
    url: 'https://www.wisefacturacion.com', // Reemplaza con tu dominio final
    siteName: 'Wise Factura',
    images: [
      {
        url: '/images/muck_wise_Home.png', // URL absoluta de tu imagen
        width: 600,
        height: 300,
        alt: 'Wise facturacion electronica',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

export default function VerticalLayout({ children }) {
  return (
    <html lang="es" >
      <body className='bg-[#F5F5F5]'>
        <GoogleTagManager gtmId="G-NF68M2HCH2" />
        <GoogleAnalytics gaId="G-NF68M2HCH2" />
        {children}
      </body>
    </html>
  );
}
