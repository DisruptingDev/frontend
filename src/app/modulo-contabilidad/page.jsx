import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';

export const metadata = {
  title: 'Módulo de Contabilidad Electrónica: Pólizas y Balanzas SAT | Wise',
  description: 'Convierte tus facturas CFDI 4.0 en pólizas de ingreso, egreso y diario. Genera la balanza de comprobación y catálogo de cuentas conforme al SAT.',
  keywords: [
    'contabilidad electrónica sat',
    'generación de pólizas cfdi 4.0',
    'balanza de comprobación xml sat',
    'software contable para pymes méxico',
    'sistema contable en la nube puebla',
  ],
  alternates: {
    canonical: '/modulo-contabilidad',
  },
};

export default function ModuloContabilidadPage() {
  const heroStats = [
    { value: 'Automático', label: 'Conversión de CFDI a Pólizas contables' },
    { value: 'Código SAT', label: 'Catálogo de cuentas agrupador alineado' },
    { value: 'Balanza XML', label: 'Lista para entrega en Buzón Tributario' },
    { value: 'En la Nube', label: 'Acceso seguro desde cualquier lugar' },
  ];

  const keyBenefits = [
    {
      icon: <AutoFixHighRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Pólizas Automáticas desde tus Facturas',
      desc: 'Olvídate de la captura manual de asientos contables. Wise lee los UUIDs de tus facturas de ingresos, gastos y nómina y genera las pólizas al instante.',
    },
    {
      icon: <AccountTreeRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Catálogo Agrupador del SAT Oficial',
      desc: 'Estructura contable conforme al anexo 24 del SAT, garantizando que cada cuenta y subcuenta cuente con el código agrupador correcto.',
    },
    {
      icon: <BalanceRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Balanza de Comprobación en XML',
      desc: 'Genera con un solo clic el archivo XML de la balanza mensual para su presentación directa ante el Buzón Tributario.',
    },
    {
      icon: <FileDownloadRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Exportación a Excel y Formatos Universales',
      desc: 'Exporta balanzas, libros mayores y auxiliares de cuentas para compartirlos fácilmente con directivos y auditores.',
    },
    {
      icon: <TimelineRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Estados Financieros Básicos al Día',
      desc: 'Monitorea el balance general y estado de resultados preliminar con cifras actualizadas al momento de cada timbrado.',
    },
    {
      icon: <CalculateRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Integración Nativa con Multi RFC y Descarga Masiva',
      desc: 'Descarga tus XMLs del SAT y conviértelos de inmediato en registros contables para cualquier cliente o empresa de tu cuenta.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Configura o importa tu catálogo de cuentas',
      desc: 'Utiliza la plantilla predeterminada con códigos del SAT o personaliza las cuentas contables de tu negocio.',
    },
    {
      title: 'Emite o importa tus CFDI 4.0',
      desc: 'Tus facturas timbradas y las descargadas del SAT generan automáticamente las pólizas correspondientes.',
    },
    {
      title: 'Genera balanzas y reportes fiscales',
      desc: 'Descarga el XML de la balanza de comprobación listo para su validación y envío al SAT.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Contadores y Despachos',
      title: 'Contadores Públicos y Despachos',
      desc: 'Acelera el cierre mensual de decenas de empresas automatizando la contabilización de comprobantes fiscales.',
    },
    {
      badge: 'PyMEs y Administradores',
      title: 'Empresas Obligadas a Contabilidad Electrónica',
      desc: 'Cumple con el envío mensual de balanzas al SAT sin incurrir en licencias de software contable tradicionales y costosas.',
    },
    {
      badge: 'Startups y Nuevos Negocios',
      title: 'Empresas en Crecimiento',
      desc: 'Mantén un control financiero formal desde el primer día sin complicaciones operativas.',
    },
  ];

  const faqItems = [
    {
      q: '¿Qué es la contabilidad electrónica según el SAT?',
      a: 'Es la obligación fiscal de llevar registros y asientos contables a través de medios electrónicos e ingresar de forma periódica tu información contable (catálogo de cuentas y balanza de comprobación) a través de la página del SAT.',
    },
    {
      q: '¿Wise genera el archivo XML para el Buzón Tributario?',
      a: 'Sí. El módulo genera los archivos XML con la estructura y validaciones requeridas por el SAT para catálogo de cuentas y balanza de comprobación mensual.',
    },
    {
      q: '¿Puedo personalizar las cuentas de mi catálogo?',
      a: 'Por supuesto. Puedes agregar subcuentas y asociarlas a los códigos agrupadores oficiales del SAT según tu giro.',
    },
    {
      q: '¿Se requiere instalar algún programa en mi computadora?',
      a: 'No. Wise Facturación funciona 100% en la nube, por lo que puedes acceder a la contabilidad desde cualquier navegador web seguro.',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Automatización Contable en la Nube"
      title="Módulo de Contabilidad Electrónica conforme al SAT"
      subtitle="Genera pólizas automáticas y balanza de comprobación en XML directamente de tus facturas."
      heroDescription="Ahorra semanas de captura contable. Transforma automáticamente tus CFDI 4.0 emitidos y recibidos en pólizas de diario, ingresos y egresos listas para su presentación ante el SAT."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Lleva la contabilidad de tu empresa al siguiente nivel"
      ctaSubtitle="Regístrate en Wise y empieza a transformar tus facturas en pólizas sin costo inicial."
    />
  );
}
