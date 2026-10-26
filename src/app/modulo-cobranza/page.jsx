import ServiceLandingLayout from '@/components/LandingServices/ServiceLandingLayout';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded';

export const metadata = {
  title: 'Módulo de Cobranza y Pagos: Conciliación y REP 2.0 | Wise',
  description: 'Control de cuentas por cobrar, emisión de complementos de pago (REP 2.0) en 1 clic y conciliación bancaria. Optimiza la cobranza de tu empresa.',
  keywords: [
    'modulo de cobranza sat',
    'complemento de recepcion de pagos 2.0',
    'conciliacion de facturas y pagos',
    'control de cuentas por cobrar cfdi',
    'software de cobranza puebla mexico',
  ],
  alternates: {
    canonical: '/modulo-cobranza',
  },
};

export default function ModuloCobranzaPage() {
  const heroStats = [
    { value: '1 Clic', label: 'Emisión de Complementos de Pago REP 2.0' },
    { value: '100% Real', label: 'Monitoreo de saldo deudor por cliente' },
    { value: 'Conciliación', label: 'Cruce ágil con depósitos bancarios' },
    { value: 'Menos Mora', label: 'Recordatorios y control de cobranza' },
  ];

  const keyBenefits = [
    {
      icon: <PointOfSaleRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Emisión Instantánea de Recibos de Pago (REP 2.0)',
      desc: 'Genera el Complemento de Recepción de Pagos oficial del SAT en un clic en cuanto tu cliente liquide una factura PPD.',
    },
    {
      icon: <ReceiptLongRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Monitoreo de Facturas Cobradas y Pendientes',
      desc: 'Visualiza en tiempo real qué clientes están al corriente y cuáles tienen comprobantes con saldo insoluto vencido.',
    },
    {
      icon: <SyncAltRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Conciliación Bancaria con tus CFDI',
      desc: 'Asocia los movimientos de tus cuentas de banco directamente a las facturas emitidas, evitando pérdidas de información o descuadres.',
    },
    {
      icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Control de Cargos Recurrentes y Saldos',
      desc: 'Ideal para escuelas, academias, servicios mensuales o suscripciones. Monitorea colegiaturas o cuotas periódicas de tus clientes.',
    },
    {
      icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Seguimiento Oportuno de Cuentas por Cobrar',
      desc: 'Reduce la cartera vencida con reportes claros que te permiten contactar a tus clientes antes de que las facturas caigan en mora.',
    },
    {
      icon: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 32 }} />,
      title: 'Cumplimiento SAT en Operaciones a Crédito (PPD)',
      desc: 'Mantén en estricto orden los métodos de pago PPD (Pago en Parcialidades o Diferido) y sus respectivos complementos fiscales.',
    },
  ];

  const howItWorksSteps = [
    {
      title: 'Emite tus facturas PPD',
      desc: 'Genera tus facturas electrónicas a crédito en Wise indicando las parcialidades acordadas con tu cliente.',
    },
    {
      title: 'Registra los depósitos recibidos',
      desc: 'Captura el pago del cliente o asócialo desde el estado de cuenta bancario para actualizar el saldo insoluto.',
    },
    {
      title: 'Timbra el Complemento de Pago (REP)',
      desc: 'Genera el comprobante fiscal de pago con un solo clic y envíale automáticamente su XML y PDF al cliente.',
    },
  ];

  const targetAudience = [
    {
      badge: 'Empresas Comerciales',
      title: 'PyMEs con Ventas a Crédito',
      desc: 'Empresas que otorgan crédito a 15, 30 o 60 días y necesitan controlar pagos parciales sin desorden contable.',
    },
    {
      badge: 'Servicios e Instituciones',
      title: 'Escuelas, Universidades y Servicios Recurrentes',
      desc: 'Administración de alumnos, colegiaturas, contratos de mantenimiento y cuotas periódicas con facturación ágil.',
    },
    {
      badge: 'Departamentos Administrativos',
      title: 'Auxiliares de Cuentas por Cobrar y Tesorería',
      desc: 'Herramienta intuitiva para conciliar pagos del día sin depender de hojas de cálculo desactualizadas.',
    },
  ];

  const faqItems = [
    {
      q: '¿Qué es el Complemento de Recepción de Pagos (REP 2.0)?',
      a: 'Es un comprobante fiscal digital que se emite cuando recibes el pago de una factura que se emitió bajo el método PPD (Pago en Parcialidades o Diferido), obligatorio por el SAT.',
    },
    {
      q: '¿Puedo aplicar un solo pago a múltiples facturas?',
      a: 'Sí, Wise permite asociar un único depósito o transferencia bancaria a varias facturas del mismo cliente desglosando los saldos correspondientes.',
    },
    {
      q: '¿Cómo me ayuda el módulo de cobranza a reducir la cartera vencida?',
      a: 'El panel te muestra semáforos de antigüedad de saldos y alertas de facturas próximas a vencer para gestionar cobros a tiempo.',
    },
    {
      q: '¿El módulo se sincroniza con el módulo de contabilidad?',
      a: 'Totalmente. Cada pago registrado y timbrado puede integrarse al flujo contable de pólizas de ingreso automáticamente.',
    },
  ];

  return (
    <ServiceLandingLayout
      badge="Gestión de Cartera y Cobros"
      title="Módulo de Cobranza Inteligente y Complementos de Pago"
      subtitle="Controla tus cuentas por cobrar y emite tus recibos de pago (REP 2.0) en un solo clic."
      heroDescription="Optimiza el flujo de efectivo de tu empresa. Monitorea facturas pendientes, concilia tus depósitos bancarios y cumple al 100% con las disposiciones fiscales del SAT para operaciones a crédito."
      heroStats={heroStats}
      keyBenefits={keyBenefits}
      howItWorksSteps={howItWorksSteps}
      targetAudience={targetAudience}
      faqItems={faqItems}
      ctaTitle="Recupera el control de tus cobros y complementos de pago"
      ctaSubtitle="Crea tu cuenta gratis en Wise y empieza a gestionar tu cobranza con folios de bienvenida."
    />
  );
}
