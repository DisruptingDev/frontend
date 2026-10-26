import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';

export const metadata = {
  title: 'Timbrado de Nómina CFDI 4.0 Masivo (Complemento 1.2) | Wise',
  description: 'Timbrado masivo de recibos de nómina CFDI 4.0 con complemento 1.2. Importa desde Excel, valida RFC y CURP, y dispersa los recibos por correo al instante.',
  keywords: [
    'timbrado de nómina cfdi 4.0',
    'recibos de nómina timbrados',
    'complemento de nómina 1.2',
    'timbrado masivo de recibos de nómina',
    'software de nómina sat méxico',
  ],
  alternates: {
    canonical: '/timbrado-nomina',
  },
};

export default function TimbradoNominaPage() {
  const heroStats = [
    { value: '1.2 SAT', label: 'Complemento de Nómina vigente' },
    { value: 'Masivo', label: 'Carga por Excel y timbrado en lote' },
    { value: '< 2 seg', label: 'Timbrado promedio por recibo' },
    { value: 'Automático', label: 'Envío de XML y PDF a colaboradores' },
  ];

  const keyBenefits = [
    {
      icon: <UploadFileRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Carga Masiva desde Excel / CSV',
      desc: 'Sube las percepciones, deducciones, horas extras y prestaciones de todos tus empleados mediante una plantilla sencilla y estructurada.',
    },
    {
      icon: <VerifiedRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Validación Fiscal SAT en Tiempo Real',
      desc: 'El sistema valida automáticamente que el RFC, CURP, NSS, régimen de contratación y código postal del colaborador coincidan con el padrón del SAT.',
    },
    {
      icon: <MarkEmailReadRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Dispersión y Envío Automatizado',
      desc: 'Al timbrar, cada colaborador recibe de inmediato en su bandeja de correo el archivo XML firmado y la representación impresa en PDF de su recibo.',
    },
    {
      icon: <BadgeRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Complemento de Nómina 1.2 Oficial',
      desc: 'Cumplimiento del 100% con los estándares fiscales más recientes exigidos por el SAT para deducciones de nómina de las empresas.',
    },
    {
      icon: <TimerRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Timbrado en Lote en Segundos',
      desc: 'Procesa nóminas quincenales, semanales, asimilados a salarios o aguinaldos para 10 o 500 trabajadores en un solo clic.',
    },
    {
      icon: <GroupsRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Catálogo de Empleados Reutilizable',
      desc: 'Guarda los datos de tu plantilla laboral y actualiza únicamente los montos variables de cada periodo para ahorrar tiempo.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Descarga y llena la plantilla de nómina',
      desc: 'Utiliza nuestra plantilla prediseñada en Excel con los datos de tus empleados, percepciones y deducciones del periodo.',
    },
    {
      title: 'Sube el archivo para validación automática',
      desc: 'Wise verifica que no existan inconsistencias con las reglas del SAT ni errores en los datos del personal.',
    },
    {
      title: 'Timbra la nómina y envía por correo',
      desc: 'Haz clic en Timbrar para generar todos los recibos CFDI 4.0 y enviarlos de forma individualizada a cada trabajador.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Recursos Humanos',
      title: 'Empresas y Departamentos de RRHH',
      desc: 'Simplifica la dispersión de recibos y el timbrado quincenal o mensual sin pagar sistemas de nómina exorbitantes.',
    },
    {
      badge: 'Despachos Contables',
      title: 'Contadores y Asesores de Nómina',
      desc: 'Administra la nómina de múltiples clientes y empresas patronales desde una sola cuenta Multi RFC.',
    },
    {
      badge: 'PyMEs',
      title: 'Pequeñas y Medianas Empresas',
      desc: 'Cumple cabalmente con la ley laboral y las deducciones del SAT de tu equipo de forma rápida y económica.',
    },
  ];

  const faqItems = [
    {
      q: '¿Wise valida el RFC y código postal del empleado antes de timbrar?',
      a: 'Sí. El sistema revisa los datos contra el catálogo del SAT para evitar rechazos en el timbrado por inconsistencias en el nombre, RFC o código postal fiscal.',
    },
    {
      q: '¿Puedo timbrar nómina extraordinaria como aguinaldos o finiquitos?',
      a: 'Por supuesto. La plantilla permite especificar si el recibo corresponde a nómina ordinaria (quincenal, semanal) o extraordinaria (PTU, aguinaldo, indemnización).',
    },
    {
      q: '¿Los recibos se pueden cancelar en caso de error?',
      a: 'Sí, Wise permite la cancelación de recibos de nómina conforme al esquema del SAT y la emisión de comprobantes de sustitución si es necesario.',
    },
    {
      q: '¿Cómo reciben los empleados sus recibos?',
      a: 'Si registras el correo del colaborador, el sistema le envía automáticamente el PDF y el XML timbrado. También puedes descargar el paquete de todos los PDFs en un solo ZIP.',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Cumplimiento Fiscal y Laboral"
      title="Timbrado de Nómina CFDI 4.0 Masivo y Automatizado"
      subtitle="Emite los recibos de nómina de todo tu equipo en segundos con Complemento 1.2 del SAT."
      heroDescription="Importa tu nómina desde Excel, valida automáticamente los datos fiscales de tus colaboradores y genera cientos de recibos timbrados con envío inmediato a sus correos electrónicos."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Comienza a timbrar la nómina de tu empresa sin complicaciones"
      ctaSubtitle="Registra tu cuenta y prueba el módulo con folios sin costo. Soporte en México."
    />
  );
}
