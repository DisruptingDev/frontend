"use client";
import { ConstructionOutlined, PagesOutlined } from "@mui/icons-material";
// import html2pdf from 'html2pdf.js';
import QRCode from "qrcode";

function numeroALetras(num, moneda = "pesos") {
  const unidades = [
    "cero",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];
  const especiales = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];
  const decenas = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];
  const centenas = [
    "",
    "cien",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ];

  function convertirDecenas(num) {
    if (num < 10) return unidades[num];
    if (num >= 10 && num < 20) return especiales[num - 10];
    const dec = Math.floor(num / 10);
    const unidad = num % 10;
    return `${decenas[dec]}${unidad ? " y " + unidades[unidad] : ""}`;
  }

  function convertirCentenas(num) {
    const cen = Math.floor(num / 100);
    const dec = num % 100;
    if (cen === 1 && dec === 0) return "cien";
    if (cen === 1) return `ciento ${convertirDecenas(dec)}`; // Cambio aquí
    return `${centenas[cen]}${dec ? " " + convertirDecenas(dec) : ""}`;
  }

  function convertirMiles(num) {
    const mil = Math.floor(num / 1000);
    const resto = num % 1000;
    if (mil === 1) return `mil ${convertirCentenas(resto)}`;
    return `${convertirCentenas(mil)} mil ${convertirCentenas(resto)}`;
  }

  function convertirMillones(num) {
    const millon = Math.floor(num / 1000000);
    const resto = num % 1000000;
    if (millon === 1) return `un millón ${convertirMiles(resto)}`;
    return `${convertirCentenas(millon)} millones ${convertirMiles(resto)}`;
  }

  function convertirNumero(num) {
    if (num < 100) return convertirDecenas(num);
    if (num < 1000) return convertirCentenas(num);
    if (num < 1000000) return convertirMiles(num);
    return convertirMillones(num);
  }

  // Dividir la parte entera y decimal
  const partes = num.toFixed(2).split(".");
  const parteEntera = parseInt(partes[0], 10);
  const parteDecimal = parseInt(partes[1], 10);

  let monedaLetra = `${convertirNumero(parteEntera)} ${moneda}`;
  if (parteDecimal > 0) {
    monedaLetra += ` con ${convertirNumero(parteDecimal)} centavos`;
  }

  return monedaLetra.toUpperCase();
}

// Prueba
//console.log(numeroALetras(171.68)); // Debería imprimir "CIENTO SETENTA Y UN PESOS CON SESENTA Y OCHO CENTAVOS"
// Función para cargar la plantilla HTML desde un archivo
const loadTemplate = async (path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error("No se pudo cargar la plantilla");
    }
    return await response.text();
  } catch (error) {
    console.error("Error al cargar la plantilla:", error);
    return "";
  }
};

// Función para reemplazar los placeholders en la plantilla con los datos de factura
const fillTemplate = async (template, data) => {
  let factura;

  if (data.factura) {
    factura = data.factura;
    //console.log("Factura contenido:",factura);
  } else {
    factura = data;
    //console.log("Factura contenido:",factura);
  }

  let direccionEmisor = "";
  if (factura.Calle) {
    direccionEmisor += factura.Calle;
    if (factura.NumeroExterior) {
      direccionEmisor += ", " + factura.NumeroExterior;
    }
    if (factura.NumeroInterior) {
      direccionEmisor += ", " + factura.NumeroInterior;
    }
    if (factura.Emisor.Colonia) {
      direccionEmisor += ", " + factura.Colonia;
    }
    if (factura.Emisor.Municipio) {
      direccionEmisor += ", " + factura.Municipio;
    }
  }

  //console.log("direccionEmisor", direccionEmisor);

  let direccionReceptor = "";
  if (factura.Calle) {
    direccionReceptor += factura.Calle;
    if (factura.Receptor.NumeroExterior) {
      direccionReceptor += ", " + factura.NumeroExterior;
    }
    if (factura.Receptor.NumeroInterior) {
      direccionReceptor += ", " + factura.NumeroInterior;
    }
    if (factura.Receptor.Colonia) {
      direccionReceptor += ", " + factura.Colonia;
    }
    if (factura.Receptor.Municipio) {
      direccionReceptor += ", " + factura.Municipio;
    }
    if (factura.Receptor.Estado) {
      direccionReceptor += ", " + factura.Estado;
    }
  }
  //console.log("direccionReceptor", direccionReceptor);

  if (direccionEmisor.includes("undefined")) {
    direccionEmisor = "";
  }
  if (direccionReceptor.includes("undefined")) {
    direccionReceptor = "";
  }

  let qrImageBase64 = "";

  if (factura.uuid) {
    const firma = factura.Certificado;
    const ultimos8 = firma.slice(-8);
    const cadenaQr = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&id=${factura.uuid}&re=${factura.Emisor.Rfc}&rr=${factura.Receptor.Rfc}&tt=${factura.Total}&fe=${ultimos8}`;
    // Generar código QR dinámico desde la cadena
    try {
      qrImageBase64 = await QRCode.toDataURL(cadenaQr, {
        errorCorrectionLevel: "H",
      });
    } catch (error) {
      console.error("Error al generar el código QR:", error);
    }
  }
  console.log("Data", data);

  console.log("Monto", data.Monto);
  console.log("TipoCambio", data.TipoCambio);

  let formaPago,
    metodoPago,
    regimenFiscalEmisor,
    RegimenFiscalReceptor,
    usoCFDI;
  if (data.forma_pago) {
    formaPago = data.forma_pago.Clave + " " + " Pago en una sola exhibición";
    metodoPago = data.metodo_pago.Clave + " " + data.metodo_pago.Descripcion;
    regimenFiscalEmisor =
      data.regimen_fiscal_emisor.Clave +
      " " +
      data.regimen_fiscal_emisor.Descripcion;
    RegimenFiscalReceptor =
      data.regimen_fiscal_receptor.Clave +
      " " +
      data.regimen_fiscal_receptor.Descripcion;
    usoCFDI = factura.UsoCFDI;
  } else {
    formaPago = factura.FormaPago + " " + factura.FormaPagoDescripcion;
    metodoPago = factura.MetodoPago + " " + factura.MetodoPagoDescripcion;
    regimenFiscalEmisor = factura.regimenFiscalEmisor;

    RegimenFiscalReceptor = factura.regimenFiscalEmisor;
    usoCFDI = factura.UsoCFDI;
  }

  const Base = parseFloat(factura.MontoPago).toFixed(2) - parseFloat(factura.MontoPago).toFixed(2) * 0.16;

  const conceptosHTML = `
      <tr>
        <td>84111506</td>
        <td></td>
        <td>1</td>
        <td>ACT</td>
        <td></td>
        <td>Pago</td>
        <td>$ 0.00</td>
        <td>$ 0.00</td>
        <td>$ 0.00</td>
      </tr>`;

  // Reemplazar los placeholders en la plantilla con los valores correspondientes
  return (
    template
      .replace(
        "{{qrCode}}",
        qrImageBase64
          ? `<img src="${qrImageBase64}" alt="Código QR">`
          : '<img src="/images/qr-code.png" alt="Código QR">'
      )
      .replace(
        "{{logo}}",
        factura.LogoPath
          ? `<img src="${factura.LogoPath}" alt="Logo">`
          : '<img src="/images/Logo_wise_factura.png" alt="Logo">'
      )
      .replace("{{nombreEmisor}}", factura.NombreEmisor || "")
      .replace("{{rfcEmisor}}", factura.RFCEmisor || "")
      .replace("{{direccionEmisor}}", direccionEmisor || "")
      .replace("{{regimenFiscalEmisor}}", factura.RegimenFiscalEmisor)

      .replace("{{folioFactura}}", factura.Folio || "")
      .replace("{{folioFiscal}}", factura.uuid || "")
      .replace("{{serieCSD}}", factura.NoCertificado || "")
      .replace("{{fechaEmision}}", data.FechaPago || "")
      .replace("{{TipoComprobante}}", factura.TipoDeComprobante || "")
      .replace("{{Exportacion}}", factura.Exportacion || "")

      .replace("{{nombreReceptor}}", factura.NombreReceptor)
      .replace("{{rfcReceptor}}", factura.RFCReceptor)
      .replace("{{regimenFiscalReceptor}}", factura.RegimenFiscalReceptor)
      .replace(
        "{{direccionReceptor}}",
        factura.ReceptorDireccion || direccionReceptor || ""
      )
      .replace(
        "{{CPReceptor}}",
        factura.DomicilioFiscalReceptor || direccionReceptor || "Sin dato"
      )

      .replace("{{fechaPago}}", data.FechaPago || "")
      .replace("{{numeroOperacion}}", factura.NumeroOperacion || "")
      .replace(
        "{{montoPago}}",
        new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
        }).format(factura.MontoPago) || ""
      )
      .replace("{{tipoCambioPago}}", data.TipoCambio || "$1.00")

      // .replace('{{usoCFDI}}',(factura.Receptor.UsoCFDI  +' ' + factura.Receptor.UsoCFDIDescripcion) || factura.UsoCFDI)
      .replace("{{subtotal}}", factura.SubTotal || "0.00")
      .replace("{{descuento}}", factura.Descuentos || "0.00")
      // .replace(
      //   "{{retenciones}}",
      //   factura.Conceptos.TotalImpuestosRetenidos.toFixed(2)
      // )
      // .replace(
      //   "{{traslados}}",
      //   factura.Conceptos.TotalImpuestosTrasladados.toFixed(2)
      // )
      .replace("{{total}}", factura.Total)
      .replace("{{totalLetra}}", numeroALetras(parseFloat(factura.MontoPago), "pesos"))
      .replace("{{version}}", factura.Version)
      .replace("{{serie}}", factura.Serie)
      .replace("{{folio}}", factura.Folio)
      .replace("{{fecha}}", data.FechaPago)
      .replace("{{lugarExpedicion}}", factura.LugarExpedicion)
      .replace("{{conceptos}}", conceptosHTML)
      // .replace('{{formaPago}}', (factura.FormaPago+' '+ factura.FormaPagoDescripcion) || factura.FormaPago)
      .replace("{{divisa}}", factura.Moneda)
      .replace("{{selloCFDI}}", factura.Sello || "<br><br>")
      .replace("{{selloSAT}}", factura.selloSAT || "<br><br>")
      .replace("{{cadenaSAT}}", factura.cadenaOriginalSAT || "<br><br>")
      .replace("{{serieCertificadoSAT}}", factura.NoCertificado || "<br><br>")
      .replace("{{fechaCertificacion}}", factura.fechaTimbrado || "<br><br>")
      .replace(
        "{{formaPago}}",
        data.FormaPago || "PUE - Pago en una sola exhibición"
      )
      .replace("{{metodoPago}}", metodoPago)
      .replace("{{condicionesPago}}", factura.CondicionesDePago || "")
      .replace("{{regimenFiscal}}", RegimenFiscalReceptor)
      .replace("{{usoCFDI}}", usoCFDI)
      .replace("{{ImportePago}}", parseFloat(factura.MontoPago).toFixed(2) || "0.00")
      .replace("{{Base}}", Base || "0.00")
      .replace("{{ImporteTraslado}}", parseFloat(factura.MontoPago).toFixed(2) * 0.16 || "0.00")
      .replace("{{ImporteRetenido}}", "0.00")
  );
};

// Función para generar el PDF usando html2pdf
const generarVistaPrevia = async (factura, doctosRelacionados = []) => {
  try {
    const template = await loadTemplate("/plantillas/plantilla-pago.html");
    if (!template) {
      throw new Error("No se pudo cargar la plantilla para la vista previa.");
    }

    // Generar HTML para los pagos relacionados
    const pagosHTML = doctosRelacionados
      .map(
        (pago) => `
      <tr>
        <td>${pago.IdDocumento || factura.uuid}</td>
        <td>${"P"}</td>
        <td>${pago.Folio || ""}</td>
        <td>${pago.MonedaDR || "MXN"}</td>
        <td>${pago.NumParcialidad || "1"}</td>
        <td>$${pago.ImpSaldoAnt?.toFixed(2) || "0.00"}</td>
        <td>$${pago.ImpPagado?.toFixed(2) || "0.00"}</td>
        <td>$${pago.ImpSaldoInsoluto?.toFixed(2) || "0.00"}</td>
        <td>${pago.ObjetoImpDR + "- Sí objeto de impuestos" || "02 - Sí objeto de impuestos"}</td>
      </tr>
    `
      )
      .join("");

    let filledTemplate = await fillTemplate(template, factura);

    // Reemplazar el placeholder de pagos en la plantilla
    filledTemplate = filledTemplate.replace("{{pagos}}", pagosHTML);

    return filledTemplate;
  } catch (error) {
    console.error("Error al mostrar la vista previa: ", error);
    throw error;
  }
};

export default generarVistaPrevia;
