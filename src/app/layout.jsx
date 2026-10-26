import './globals.css'; // Importa tus estilos globales
import Script from 'next/script';
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google'

export const metadata = {
  metadataBase: new URL('https://www.wisefacturacion.com'),
  alternates: {
    canonical: '/',
  },
  title: 'Facturación CFDI 4.0 Multi RFC y Nómina | Wise Facturación México',
  description: 'Sistema de facturación electrónica CFDI 4.0 en línea con Multi RFC, timbrado masivo, recibos de nómina, descarga masiva SAT y contabilidad. Prueba gratis con folios sin costo.',
  keywords: [
    'facturación electrónica CFDI 4.0',
    'facturación multi RFC',
    'sistema de facturación para contadores',
    'descarga masiva sat',
    'timbrado de nómina cfdi 4.0',
    'recibos de nómina timbrados',
    'contabilidad electrónica sat',
    'comprar folios cfdi',
    'timbres fiscales precio',
    'facturación electrónica puebla',
    'proveedor de timbrado masivo México',
    'wise facturacion'
  ],
  openGraph: {
    title: 'Wise Facturación - CFDI 4.0 Multi RFC, Nómina y Descarga Masiva SAT',
    description: 'Factura de manera fácil, rápida y segura. Administra múltiples RFCs, timbra nómina masiva y descarga tus XML del SAT en segundos.',
    url: 'https://www.wisefacturacion.com',
    siteName: 'Wise Facturación',
    images: [
      {
        url: '/images/muck_wise_Home.png',
        width: 600,
        height: 300,
        alt: 'Wise Facturación Electrónica CFDI 4.0',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
};

export default function VerticalLayout({ children }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.wisefacturacion.com/#organization',
        name: 'Wise Facturación',
        url: 'https://www.wisefacturacion.com',
        logo: 'https://www.wisefacturacion.com/images/Logo_wise_factura.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+52-222-725-4392',
          contactType: 'customer support',
          areaServed: 'MX',
          availableLanguage: 'Spanish',
        },
        sameAs: [
          'https://www.facebook.com/wisefacturacion/',
          'https://www.instagram.com/wisefacturacion/',
          'https://www.linkedin.com/company/wisefacturacion',
        ],
      },
      {
        '@type': 'LocalBusiness',
        '@id': 'https://www.wisefacturacion.com/#localbusiness',
        name: 'Wise Facturación',
        url: 'https://www.wisefacturacion.com',
        telephone: '+52-222-725-4392',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Puebla',
          addressRegion: 'PUE',
          addressCountry: 'MX',
        },
        priceRange: '$$',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Wise Facturación CFDI 4.0',
        operatingSystem: 'Web Browser',
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'MXN',
          lowPrice: '290.00',
          highPrice: '382800.00',
          offerCount: '12',
        },
        description: 'Software de facturación electrónica CFDI 4.0, Multi RFC, nómina masiva, descarga masiva del SAT y contabilidad en línea.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '¿Puedo facturar con varios RFC en una sola cuenta?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí, Wise Facturación incluye la funcionalidad Multi RFC que permite emitir facturas, notas de crédito y recibos para diferentes personas físicas y morales desde una misma cuenta y sin cambiar de sesión.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Cuánto cuesta un timbre o folio CFDI 4.0 en Wise?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'El costo por timbre va desde $0.77 por folio en paquetes empresariales hasta paquetes PyME accesibles desde $290 MXN por 25 folios. Todos los paquetes incluyen timbrado CFDI 4.0 con complementos oficiales.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Los folios de facturación caducan?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, tus folios comprados por paquete no tienen fecha de caducidad. Puedes utilizarlos conforme a la necesidad operativa de tu negocio.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Cómo descargo de forma masiva mis XML del SAT?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Desde el módulo de Descarga Masiva de Wise, conectas tu FIEL o contraseña CIEC y puedes solicitar y descargar paquetes completos de XML y representación en PDF tanto de CFDI emitidos como recibidos.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Wise timbra recibos de nómina electrónica?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Sí, contamos con un módulo especializado para timbrado masivo de nómina CFDI 4.0 con complemento 1.2, importando datos mediante plantillas sencillas de forma automática.',
            },
          },
          {
            '@type': 'Question',
            name: '¿Cómo obtengo mis folios sin costo al registrarme?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Al registrar tu cuenta en Wise Facturación recibes folios de bienvenida sin costo para que pruebes el sistema, configures tu CSD y generes tus primeras facturas reales sin compromisos ni tarjetas de crédito forzosas.',
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="es" >
      <body className='bg-[#F5F5F5]'>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <GoogleTagManager gtmId="G-NF68M2HCH2" />
        <GoogleAnalytics gaId="G-NF68M2HCH2" />

        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1560697885331129');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1560697885331129&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        {children}
      </body>
    </html>
  );
}
