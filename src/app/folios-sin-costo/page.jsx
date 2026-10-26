import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';

export const metadata = {
  title: 'Folios Sin Costo: Prueba Gratis Wise Facturación CFDI 4.0 | México',
  description: 'Comienza a facturar con folios sin costo. Sin tarjeta de crédito forzosa, sin plazos obligatorios y con soporte en México. Facturación CFDI 4.0 real.',
  keywords: [
    'folios sin costo facturacion',
    'prueba gratis facturacion cfdi 4.0',
    'timbres gratis sat',
    'facturar gratis online mexico',
    'sistema facturacion prueba sin tarjeta',
  ],
  alternates: {
    canonical: '/folios-sin-costo',
  },
};

export default function FoliosSinCostoPage() {
  const heroStats = [
    { value: '100% Gratis', label: 'Sin tarjeta de crédito requerida' },
    { value: 'CFDI 4.0', label: 'Validez fiscal plena ante el SAT' },
    { value: '< 2 seg', label: 'Velocidad de timbrado' },
    { value: 'Asistencia', label: 'Soporte humano para subir CSD' },
  ];

  const keyBenefits = [
    {
      icon: <CardGiftcardRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Timbres de Bienvenida sin Tarjeta de Crédito',
      desc: 'Crea tu cuenta únicamente con tu correo. No solicitamos datos bancarios ni suscripciones con cobros ocultos.',
    },
    {
      icon: <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Comprobantes Fiscales 100% Reales y Válidos',
      desc: 'No es un simulador ni un demo ficticio: son timbres fiscales auténticos certificados por PAC oficial para entregar a tus clientes.',
    },
    {
      icon: <SpeedRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Comprueba la Velocidad en Vivo',
      desc: 'Experimenta la rapidez de nuestro motor de timbrado en menos de dos segundos y la descarga inmediata de tu XML y PDF.',
    },
    {
      icon: <SupportAgentRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Acompañamiento en la Carga de tu CSD',
      desc: '¿Es tu primera vez facturando? Nuestro equipo te apoya por WhatsApp (+52 222 725 4392) a instalar tus sellos fiscales sin costo.',
    },
    {
      icon: <DevicesRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Acceso a Todas las Funciones de la Plataforma',
      desc: 'Prueba la creación de clientes, productos con claves SAT, impuestos automáticos y administración Multi RFC.',
    },
    {
      icon: <SecurityRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Tus Folios Comprados No Caducan',
      desc: 'Si decides comprar más folios en el futuro, no tienen vigencia mensual: los usas a tu propio ritmo según tus ventas.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Regístrate con tu correo electrónico',
      desc: 'Ingresa tus datos básicos y activa tu cuenta al instante sin ingresar tarjetas de crédito.',
    },
    {
      title: 'Carga tus sellos CSD del SAT',
      desc: 'Sube tus archivos .cer y .key de Certificado de Sello Digital. La plataforma los almacena con cifrado bancario seguro.',
    },
    {
      title: 'Emite tu primera factura CFDI 4.0',
      desc: 'Genera tu comprobante fiscal, descárgalo o envíalo por correo a tu cliente en segundos.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Nuevos Contribuyentes',
      title: 'Emprendedores y Profesionistas',
      desc: 'Personas que inician actividades económicas y buscan una opción confiable, accesible y fácil para emitir sus primeras facturas.',
    },
    {
      badge: 'Migraciones de Sistemas',
      title: 'Empresas insatisfechas con su facturador actual',
      desc: 'Negocios cansados de plataformas lentas, caídas frecuentes o costos anuales forzosos que quieren comprobar la calidad de Wise.',
    },
    {
      badge: 'Despachos y Asesores',
      title: 'Contadores Independientes',
      desc: 'Profesionales que desean evaluar la funcionalidad Multi RFC antes de migrar a toda su cartera de clientes.',
    },
  ];

  const faqItems = [
    {
      q: '¿Por qué Wise regala folios al registrarme?',
      a: 'Queremos que compruebes por ti mismo la velocidad, facilidad y soporte de nuestra plataforma antes de realizar cualquier compra, con total transparencia.',
    },
    {
      q: '¿Tengo que ingresar una tarjeta de crédito para obtenerlos?',
      a: 'No. No solicitamos datos bancarios para registrarte ni para usar tus folios de bienvenida.',
    },
    {
      q: '¿Qué pasa cuando se terminan mis folios sin costo?',
      a: 'Puedes adquirir paquetes de timbres desde $290 MXN (25 folios) sin plazos forzosos y con folios que nunca caducan.',
    },
    {
      q: '¿Las facturas timbradas con estos folios son válidas ante el SAT?',
      a: 'Sí, son comprobantes fiscales digitales CFDI 4.0 completamente válidos y certificados ante el SAT.',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Prueba Sin Riesgo"
      title="Empieza a Facturar con Folios Sin Costo al Registrarte"
      subtitle="Comprueba la plataforma de facturación CFDI 4.0 más rápida y fácil de México."
      heroDescription="Crea tu cuenta en 1 minuto y recibe folios de bienvenida para timbrar tus primeros comprobantes fiscales reales. Sin tarjetas de crédito, sin plazos forzosos y con soporte en México."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Obtén tus folios sin costo hoy mismo"
      ctaSubtitle="Sin tarjeta de crédito requerida. Empieza a facturar en menos de 3 minutos."
    />
  );
}
