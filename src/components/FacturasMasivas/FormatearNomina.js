import { formatSATDate } from "@/utils/formatDates";

/**
 * FormatearNomina.js
 * Builds the full GuardarFactura payload for a nómina comprobante
 * from a single parsed Excel row + the selected Emisor object.
 *
 * @param {Object} row        - One row parsed from the Excel file
 * @param {Object} emisor     - Selected Emisor from the dropdown { ID, LugarExpedicion, RegistroPatronal, Rfc, ... }
 * @returns {Object}          - Full GuardarFactura payload
 */
export default function FormatearNomina(row, emisor) {
    // ---------- helpers ----------
    const num = (v) => Number(parseFloat(v || 0).toFixed(2));
    const str = (v) => String(v || "");

    // Flexible key getter – tries exact, UPPER, lower, and snake_case
    const g = (key) => {
        const variants = [
            key,
            key.toUpperCase(),
            key.toLowerCase(),
            key.replace(/ /g, "_").toLowerCase(),
            key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, ""), // PascalCase to snake_case
        ];
        for (const v of variants) {
            if (row[v] !== undefined && row[v] !== null && row[v] !== "") return row[v];
        }
        return "";
    };

    // ---------- extract fields from Excel row ----------
    const totalPercepciones = num(g("Total Percepciones") || g("TotalPercepciones"));
    const totalDeducciones = num(g("Total Deducciones") || g("TotalDeducciones"));
    const totalOtrosPagos = num(g("Total Otros Pagos") || g("TotalOtrosPagos"));
    const importeGravado = num(g("Importe Gravado") || g("ImporteGravado"));
    const importeExento = num(g("Importe Exento") || g("ImporteExento"));
    const isrImporte = num(g("ISR") || g("Importe ISR") || g("ImporteISR") || g("Deduccion ISR"));

    // Nomina receptor fields
    const curp = str(g("CURP") || g("Curp"));
    const nss = str(g("NSS") || g("NoSeguroSocial") || g("NumSeguridadSocial"));
    const fechaInicioRL = formatSATDate(g("Fecha Inicio Laboral") || g("FechaInicioRelLaboral") || g("fecha_inicio_laboral") || "2024-01-01");
    const antiguedad = str(g("Antigüedad") || g("Antiguedad") || g("P1Y"));
    const tipoContrato = str(g("TipoContrato") || g("Tipo Contrato") || g("01"));
    const tipoJornada = str(g("TipoJornada") || g("Tipo Jornada") || g("01"));
    const tipoRegimen = str(g("TipoRegimen") || g("Tipo Regimen") || g("02"));
    const numEmpleado = str(g("No. Empleado") || g("NumEmpleado") || g("Num Empleado") || g("num_empleado"));
    const departamento = str(g("Departamento"));
    const puesto = str(g("Puesto"));
    const riesgoPuesto = str(g("Riesgo Puesto") || g("RiesgoPuesto") || "1");
    const periodicidadPago = str(g("Periodicidad Pago") || g("PeriodicidadPago") || "04");
    const cuentaBancaria = str(g("Cuenta Bancaria") || g("CuentaBancaria"));
    const banco = str(g("Banco") || g("ClaveBanco") || "002");
    const salarioBase = num(g("Salario Base") || g("SalarioBaseCotApor"));
    const salarioDiario = num(g("Salario Diario") || g("SalarioDiarioIntegrado"));
    const claveEntFed = str(g("ClaveEntFed") || g("Estado") || "NL");
    const receptorID = num(g("ReceptorID") || g("receptor_id") || g("ID Receptor"));

    // Nomina dates / general
    const fechaPago = formatSATDate(g("Fecha Pago") || g("FechaPago"));
    const fechaInicial = formatSATDate(g("Fecha Inicial Pago") || g("FechaInicialPago") || g("Fecha Inicial"));
    const fechaFinal = formatSATDate(g("Fecha Final Pago") || g("FechaFinalPago") || g("Fecha Final"));
    const numDias = num(g("Dias Pagados") || g("NumDiasPagados") || g("Días Pagados"));
    const tipoNomina = str(g("Tipo Nomina") || g("TipoNomina") || "O"); // O = ordinaria, E = extraordinaria

    // Percepciones detail (single perception row from Excel – most common case)
    const tipoPercepcion = str(g("Tipo Percepcion") || g("TipoPercepcion") || "001");
    const clavePercepcion = str(g("Clave Percepcion") || g("ClavePercepcion") || "P001");
    const conceptoPerc = str(g("Concepto Percepcion") || g("ConceptoPercepcion") || "Sueldo");

    // Deducciones detail
    const tipoDeduccion = str(g("Tipo Deduccion") || g("TipoDeduccion") || "002");
    const claveDeduccion = str(g("Clave Deduccion") || g("ClaveDeduccion") || "D001");
    const conceptoDed = str(g("Concepto Deduccion") || g("ConceptoDeduccion") || "ISR");

    // Emisor nomina fields
    const registroPatronal = str(emisor?.RegistroPatronal || g("RegistroPatronal"));
    const rfcPatronOrigen = str(emisor?.Rfc || g("RFCPatronOrigen") || g("RFC Patron"));
    const lugarExpedicion = str(emisor?.LugarExpedicion || "64000");
    const emisorID = num(emisor?.ID);

    // ---------- financial totals ----------
    const subTotal = num(totalPercepciones);
    const total = num(totalPercepciones - totalDeducciones + totalOtrosPagos);
    const totalSueldos = num(totalPercepciones);
    const totalGravado = num(importeGravado || (totalPercepciones - importeExento));
    const totalExento = num(importeExento);

    // ---------- timestamp ----------
    const fecha = formatSATDate();


    // ---------- build payload ----------
    const payload = {
        Version: "4.0",
        Serie: "NOM",
        Fecha: fecha,
        FormaPago: "99",
        CondicionesDePago: "CONTADO",
        SubTotal: subTotal,
        SubTotalString: String(subTotal.toFixed(2)),
        Descripcion: "Pago de nómina",
        Descuento: 0.00,
        DescuentoString: "0.00",
        Moneda: "MXN",
        TipoCambio: "1",
        Total: total,
        TotalString: String(total.toFixed(2)),
        TipoDeComprobante: "N",
        Exportacion: "01",
        MetodoPago: "PUE",
        LugarExpedicion: lugarExpedicion,
        EmisorID: emisorID,
        ReceptorID: receptorID,
        UsoCFDI: "CN01",

        Conceptos: {
            ListaConceptos: [
                {
                    ClaveProdServ: "84111505",
                    NoIdentificacion: numEmpleado ? `NOM-${numEmpleado}` : "NOM-001",
                    Cantidad: 1,
                    ClaveUnidad: "ACT",
                    Unidad: "Actividad",
                    Descripcion: "Pago de nómina",
                    ValorUnitario: subTotal,
                    Importe: subTotal,
                    Descuento: 0.00,
                    ObjetoImp: "01",
                    Impuestos: {
                        Traslados: [],
                        Retenciones: []
                    }
                }
            ],
            TotalImpuestosTrasladados: 0.00,
            TotalImpuestosRetenidos: 0.00
        },

        Complemento: {
            Nomina: {
                Version: "1.2",
                TipoNomina: tipoNomina,
                FechaPago: fechaPago,
                FechaInicialPago: fechaInicial,
                FechaFinalPago: fechaFinal,
                NumDiasPagados: numDias,
                TotalPercepciones: totalPercepciones,
                TotalDeducciones: totalDeducciones,
                TotalOtrosPagos: totalOtrosPagos,

                Emisor: {
                    RegistroPatronal: registroPatronal,
                    RFCPatronOrigen: rfcPatronOrigen
                },

                Receptor: {
                    Curp: curp,
                    NumSeguridadSocial: nss,
                    FechaInicioRelLaboral: fechaInicioRL,
                    Antigüedad: antiguedad,
                    TipoContrato: tipoContrato,
                    TipoJornada: tipoJornada,
                    TipoRegimen: tipoRegimen,
                    NumEmpleado: numEmpleado,
                    Departamento: departamento,
                    Puesto: puesto,
                    RiesgoPuesto: riesgoPuesto,
                    PeriodicidadPago: periodicidadPago,
                    CuentaBancaria: cuentaBancaria,
                    Banco: banco,
                    SalarioBaseCotApor: salarioBase,
                    SalarioDiarioIntegrado: salarioDiario,
                    ClaveEntFed: claveEntFed
                },

                Percepciones: {
                    TotalSueldos: totalSueldos,
                    TotalGravado: totalGravado,
                    TotalExento: totalExento,
                    Percepciones: [
                        {
                            TipoPercepcion: tipoPercepcion,
                            Clave: clavePercepcion,
                            Concepto: conceptoPerc,
                            ImporteGravado: num(importeGravado),
                            ImporteExento: num(importeExento)
                        }
                    ]
                },

                Deducciones: {
                    TotalOtrasDeducciones: 0.00,
                    TotalImpuestosRetenidos: isrImporte,
                    Deducciones: isrImporte > 0 ? [
                        {
                            TipoDeduccion: tipoDeduccion,
                            Clave: claveDeduccion,
                            Concepto: conceptoDed,
                            Importe: isrImporte
                        }
                    ] : []
                },

                OtrosPagos: {
                    OtrosPagos: []
                }
            }
        }
    };

    console.log("📋 Payload GuardarFactura Nómina:", JSON.stringify(payload, null, 2));
    return payload;
}
