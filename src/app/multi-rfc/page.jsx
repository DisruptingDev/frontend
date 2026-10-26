import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

export const metadata = {
  title: 'Multi RFC: Facturación para Varios RFC en una Sola Cuenta | Wise',
  description: 'Sistema de facturación electrónica Multi RFC para contadores y empresas en México. Administra personas físicas y morales sin cambiar de cuenta.',
  keywords: [
    'facturar varios rfc una cuenta',
    'sistema de facturación para contadores',
    'software para despachos contables',
    'multi rfc sat cfdi 4.0',
    'facturación electrónica multi empresa méxico',
  ],
  alternates: {
    canonical: '/multi-rfc',
  },
};

export default function MultiRfcPage() {
  const heroStats = [
    { value: 'Ilimitados', label: 'RFCs en una sola cuenta' },
    { value: '0 seg', label: 'Tiempo para cambiar de empresa' },
    { value: '100%', label: 'Control de roles y permisos' },
    { value: '70%', label: 'Ahorro de tiempo en despachos' },
  ];

  const keyBenefits = [
    {
      icon: <BusinessRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Múltiples Razones Sociales',
      desc: 'Emite facturas de ingreso, egreso, complementos de pago y nómina para todas tus personas físicas y morales desde una misma interfaz.',
    },
    {
      icon: <SwapHorizRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Cambio de Empresa en 1 Clic',
      desc: 'Olvídate de cerrar sesión y recordar múltiples contraseñas. Cambia de emisor al instante con un selector inteligente.',
    },
    {
      icon: <GroupAddRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Usuarios, Roles y Permisos por RFC',
      desc: 'Asigna a cada auxiliar o colaborador acceso exclusivo a ciertas empresas o funciones (solo facturar, solo timbrar o administración total).',
    },
    {
      icon: <SecurityRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Catálogos y CSD Independientes',
      desc: 'Cada RFC mantiene de manera segura sus propios Certificados de Sello Digital (CSD), series, folios y catálogos de clientes y productos.',
    },
    {
      icon: <SpeedRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Bolsa de Timbres Compartida o Asignada',
      desc: 'Flexibilidad total: distribuye folios entre tus diferentes RFCs según el volumen de facturación de cada uno sin desperdiciar timbres.',
    },
    {
      icon: <AssessmentRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Reportes y Auditoría Centralizada',
      desc: 'Descarga reportes consolidados o individuales de emisión y cobranza para facilitar cierres contables y auditorías fiscales.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Registra tu cuenta principal',
      desc: 'Crea tu usuario maestro en Wise en menos de 1 minuto y recibe tus primeros folios sin costo.',
    },
    {
      title: 'Agrega tus empresas y CSD',
      desc: 'Sube los certificados de sello digital (.cer y .key) de cada persona física o moral que desees administrar.',
    },
    {
      title: 'Factura y delega accesos',
      desc: 'Empieza a emitir CFDI 4.0 eligiendo el emisor con un solo clic e invita a tu equipo de trabajo con permisos controlados.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Despachos Contables',
      title: 'Contadores y Asesores Fiscales',
      desc: 'Lleva la facturación de 5, 20 o más clientes desde una única plataforma moderna sin pagar costos ocultos por cada RFC.',
    },
    {
      badge: 'Grupos Empresariales',
      title: 'Holdings y Corporativos',
      desc: 'Gestiona subsidiarias, franquicias y unidades de negocio con total trazabilidad contable y separación fiscal.',
    },
    {
      badge: 'Emprendedores con varios negocios',
      title: 'Empresarios Multi-giro',
      desc: 'Factura tus diferentes proyectos y actividades económicas (RESICO, Actividad Empresarial, etc.) sin complicarte la vida.',
    },
  ];

  const faqItems = [
    {
      q: '¿Cuántos RFC puedo agregar a mi cuenta?',
      a: 'En Wise Facturación no tienes límite restrictivo de RFCs. Puedes administrar todas las razones sociales de tus clientes o empresas en una misma cuenta.',
    },
    {
      q: '¿Los folios se pueden compartir entre empresas?',
      a: 'Sí. Puedes tener una bolsa global de folios para todos tus RFCs o asignar cuotas específicas a cada empresa según lo prefieras.',
    },
    {
      q: '¿Cada RFC tiene sus propios sellos CSD y certificados?',
      a: 'Correcto. La plataforma almacena de forma cifrada y segura el Certificado de Sello Digital (CSD) y la contraseña de cada empresa de manera totalmente independiente.',
    },
    {
      q: '¿Mis colaboradores pueden ver todas las empresas?',
      a: 'No necesariamente. El administrador principal define exactamente a qué empresas y módulos tiene permiso cada usuario invitado.',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Función Estrella Wise"
      title="Sistema de Facturación Multi RFC para Contadores y Empresas"
      subtitle="Factura para todos tus RFCs desde una sola cuenta y sin cerrar sesión."
      heroDescription="La solución definitiva para despachos contables y grupos corporativos en México. Emite CFDI 4.0, nómina y descarga masiva para múltiples personas físicas y morales desde un único panel inteligente."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Centraliza la facturación de todos tus RFCs hoy mismo"
      ctaSubtitle="Empieza con folios sin costo. Sin plazos forzosos y con asistencia técnica personalizada en México."
    />
  );
}
