# Changelog

Todos los cambios notables a este proyecto serán documentados es este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), mantenemos las versiones de acuerdo
a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Dada una versión número MAJOR.MINOR.PATCH:** (aplica a partir de 2.0.0)

* Se incrementará **MAJOR**, cuando se implemente un nuevo tipo de **Módulo** que genere incompatibilidad con versión
  anterior.
* Se incrementa **MINOR**, cuando se agregue una o más **nueva(s) funcionalidad(es) a la aplicación**.
* Se incrementa **PATCH**, cuando se implemente un **fix**.

## [0.01.08] - 2026-09-08
### [FEAT]
* FEAT - Soporte para Impuestos Locales (Traslados y Retenciones) en creación, edición y clonación de facturas (CFDI 4.0 con complemento de Impuestos Locales).
* FEAT - Componente de catálogo y captura de Impuestos Locales (`ImpuestosLocales.jsx`) con selección de impuestos comunes (ISH, Impuesto Cedular, 5 al millar, 2 al millar, ISN, etc.) y montos configurables manualmente.
* FEAT - Integración dinámica de Impuestos Locales en el cálculo del Total, desglose en Resumen de factura, Vista Previa HTML y generación de PDF.
* FEAT - Carga y recuperación automática de complementos de Impuestos Locales desde la base de datos al editar y clonar facturas existentes.

### [FIX]
* FIX - Normalización de retenciones locales: los importes se muestran en positivo en la interfaz, resumen y PDF sin signo negativo antepuesto, deduciéndose correctamente del total del comprobante.
* FIX - Compatibilidad con backend en base de datos de pruebas: creación de tabla `carta_portes` para prevenir el error SQL 42P01 al guardar o editar facturas que contienen el nodo de complementos.

## [0.01.07] - 2026-08-20
### [FEAT]
* FEAT - Soporte para extraer dinámicamente claves SAT y nombre de conceptos desde el catálogo de ProductoFicha para fichas extras y colegiaturas.
* FEAT - Búsqueda automática del ConceptoCobro basado en el programa académico del estudiante en la generación de colegiatura mensual.
* FEAT - Filtro estricto multitenant (`grupo_id`) en las consultas de ConceptoCobro.

### [FIX]
* FIX - Asignación correcta de la regla fiscal "02" (Sí objeto de impuesto) y Traslado "IVA Exento" (002, Exento) en el XML y Base de Datos al facturar desde un cobro.

## [0.01.06] - 2026-08-19
### [FEAT]
* FEAT - Soporte para acciones masivas (timbrar y eliminar) de múltiples pre-facturas en el panel de Facturación CFDI.
* FEAT - Aprobación manual explícita para la creación de fichas de "Saldo a Favor" durante la conciliación bancaria para evitar crear saldos no deseados.

## [0.01.05] - 2026-08-19
### [FEAT]
* FEAT - Se agregaron las columnas `clave_prod_sat` y `grupo_id` al catálogo de `ProductoFicha`.
* FEAT - Los productos del catálogo ahora se filtran automáticamente por el grupo del usuario.
* FEAT - La generación automática de colegiaturas "1-Click" ahora identifica y asigna el producto de mensualidad correspondiente al grupo y clave SAT configurada.

## [0.01.04] - 2026-08-12
### [FEAT]
* FEAT - Soporte para enmascaramiento de remitente (`SMTP_COBRANZA_FROM_EMAIL`), nombre de remitente visible (`SMTP_COBRANZA_FROM_NAME`) y dirección de respuesta (`SMTP_COBRANZA_REPLY_TO`) exclusivo para los envíos de correo en el módulo de Cobranza.

## [0.01.03] - 2026-08-12
### [FEAT]
* FEAT - Generación automática de Ficha de Cargo en PDF con desglose de 1 o múltiples conceptos al crear fichas.
* FEAT - Envío automático del PDF de la Ficha de Cargo por correo electrónico a la dirección registrada del alumno.
* FEAT - Botones para descargar PDF oficial y re-enviar por correo electrónico desde los modales de Fichas de Pago.

## [0.01.02] - 2026-08-10
### [FIX]
* FIX - Corrección en conteo de facturas timbradas en el dashboard de super admin (rango de fechas ahora incluye el día límite completo y excluye registros vacíos).

## [0.01.01] - 2026-08-10
### [TR]
* TR - Liberación de cambios en módulo de Cobranza (alumnos, cargos, conciliación y reportes).
* FIX - Corrección de error de compilación en vista de Facturación al importar AddIcon faltante.

## [0.0.10] - 2026-07-23
### [BUG]
* BUG - Ajuste en cálculo de impuestos al editar complemento de pago

## [0.0.9] - 2026-07-21
### [BUG]
* BUG - Ajuste en cálculo de impuestos al generar complemento de pago

## [0.0.8] - 2026-07-18
### [TR]
* TR - Desarrollo de nueva funcionalidad para firma de manifiesto (Prodigia)

## [0.0.7] - 2026-07-08
### [TR]
* FIX - Ajustes en back y front para poder ver nombre del receptor de nómina en tabla de vista de nóminas.

## [0.0.6] - 2026-05-15
### [TR]
* FIX - Cambios edición y clonado de facturas.

## [0.0.5] - 2026-05-14
### [TR]
* FIX - Cambios en el payload de nóminas y sanitización de alta de clientes.

## [0.0.4] - 2026-04-23
### [TR]
* FIX - Cambios en flujo de alta de nóminas.

## [0.0.3] - 2026-04-13
### [TR]
* FIX - Plantilla para carga de trabajadores.
* FIX - Ajustar lógica de modal error y éxito en facturas masivas.
* FIX - Error al actualizar/editar UsoCFDI en importar facturas masivas.
* FIX - Error al editar de facturas información global.

## [0.0.2] - 2026-03-26
### [TR]
* FIX - Ajuste en sección de nóminas y validaciones de conceptos

## [0.0.1] - 2026-03-26
### [TR]
* TR-VERSION-INICIAL - Versión inicial publicada