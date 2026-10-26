import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import AutoModeRoundedIcon from '@mui/icons-material/AutoModeRounded';

export const metadata = {
  title: 'Descarga Masiva SAT: XML y PDF Emitidos y Recibidos | Wise',
  description: 'Descarga masiva de XML y PDF del SAT directa por webservice con CIEC o e.firma. Descarga miles de facturas en minutos y expórtalas a Excel.',
  keywords: [
    'descarga masiva de xml sat',
    'descargar cfdi emitidos y recibidos',
    'descargar facturas sat en lote',
    'recuperar facturas sat xml y pdf',
    'webservice descarga masiva sat',
  ],
  alternates: {
    canonical: '/descarga-masiva-sat',
  },
};

export default function DescargaMasivaSatPage() {
  const heroStats = [
    { value: '+200,000', label: 'CFDI descargados por solicitud' },
    { value: 'XML & PDF', label: 'Paquetes completos con representación impresa' },
    { value: '1 Clic', label: 'Exportación de metadatos a Excel' },
    { value: '100% Seguro', label: 'Conexión oficial Webservice SAT' },
  ];

  const keyBenefits = [
    {
      icon: <CloudDownloadRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Emitidos y Recibidos en Lote',
      desc: 'Solicita periodos completos (meses o años) de comprobantes tanto de tus ventas como de las compras y gastos de tu negocio.',
    },
    {
      icon: <PictureAsPdfRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Generación Automática de PDFs',
      desc: 'Wise no solo te entrega el archivo XML, también genera la representación impresa en PDF de cada comprobante para facilitar su lectura.',
    },
    {
      icon: <TableChartRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Reportes y Metadatos en Excel',
      desc: 'Obtén hojas de cálculo con UUID, fecha, RFC emisor, receptor, importes, impuestos y método de pago listos para auditorías contables.',
    },
    {
      icon: <KeyRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Conexión CIEC o e.firma (FIEL)',
      desc: 'Flexibilidad de autenticación oficial conforme a los lineamientos del Servicio de Administración Tributaria.',
    },
    {
      icon: <AutoModeRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Sincronización con Módulo Contable',
      desc: 'Los comprobantes descargados se pueden importar directamente al módulo de contabilidad de Wise para generar pólizas automáticas.',
    },
    {
      icon: <SecurityRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Sin Caídas ni Límites del Portal Web',
      desc: 'El webservice directo de Wise supera las limitaciones de 500 comprobantes por día del portal tradicional del SAT.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Conecta tus credenciales del SAT',
      desc: 'Ingresa tu CIEC o carga tu FIEL de forma encriptada y protegida para comunicarte con los servidores del SAT.',
    },
    {
      title: 'Elige tipo de comprobante y periodo',
      desc: 'Selecciona facturas emitidas o recibidas y el rango de fechas que deseas consultar.',
    },
    {
      title: 'Descarga tu paquete ZIP y reportes',
      desc: 'Una vez procesada la solicitud por el SAT, descarga el archivo comprimido con todos tus XMLs, PDFs y el resumen en Excel.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Contadores y Auditores',
      title: 'Despachos de Auditoría y Fiscalistas',
      desc: 'Concilia en minutos los ingresos y egresos de tus clientes contra lo reportado en los servidores del SAT.',
    },
    {
      badge: 'Administradores y Finanzas',
      title: 'Gerentes de Finanzas y Tesorería',
      desc: 'Recupera facturas de proveedores que nunca llegaron al correo y mantén la contabilidad al día sin pérdidas de deducciones.',
    },
    {
      badge: 'PyMEs',
      title: 'Dueños de Negocios y Emprendedores',
      desc: 'Organiza todos los respaldos fiscales de tu empresa sin perder tiempo solicitando facturas una por una.',
    },
  ];

  const faqItems = [
    {
      q: '¿Cuántos comprobantes puedo descargar por petición?',
      a: 'Mediante el webservice oficial del SAT, Wise permite solicitar hasta 200,000 CFDI por paquete, superando ampliamente el límite de 500 comprobantes del portal web del SAT.',
    },
    {
      q: '¿La descarga incluye los archivos PDF además del XML?',
      a: 'Sí. Wise incluye la funcionalidad de generar la representación impresa en PDF de tus XMLs descargados para que puedas visualizarlos y compartirlos de inmediato.',
    },
    {
      q: '¿Mis credenciales del SAT están protegidas?',
      a: 'Absolutamente. Todas las conexiones y credenciales se transmiten mediante cifrado bancario TLS de punto a punto y se procesan únicamente para la comunicación con el SAT.',
    },
    {
      q: '¿Puedo exportar los datos a Excel?',
      a: 'Sí, la plataforma genera automáticamente un archivo de Excel con todos los metadatos desglosados (subtotal, IVA, retenciones, método de pago, fecha, etc.).',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Herramienta Fiscal Clave"
      title="Descarga Masiva de XML y PDF del SAT en Minutos"
      subtitle="Recupera todos tus comprobantes fiscales emitidos y recibidos directamente por Webservice."
      heroDescription="Evita las caídas y límites del portal del SAT. Conecta tu CIEC o e.firma y descarga paquetes completos de facturas con sus representaciones impresas en PDF y reportes en Excel en un solo clic."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Automatiza tus descargas del SAT hoy mismo"
      ctaSubtitle="Empieza con folios sin costo y prueba la descarga masiva sin compromisos."
    />
  );
}
