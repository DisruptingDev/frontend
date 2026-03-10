"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Snackbar,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportarReceptor() {

  const [xmlFiles, setXmlFiles] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // ================================
  // Leer XML
  // ================================
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setXmlFiles(files);

    const dataTemp = [];

    for (const file of files) {
      try {
        const receptor = await extraerDatosXML(file);
        dataTemp.push(receptor);
      } catch (error) {
        console.error(`Error en ${file.name}`, error);
      }
    }

    // 🔥 Eliminar duplicados por RFC
    const unicos = eliminarDuplicados(dataTemp);

    setPreviewData(unicos);
  };

  // ================================
  // Extraer datos del XML
  // ================================
  const extraerDatosXML = async (file) => {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0];

    if (!receptor) throw new Error("No se encontró nodo Receptor");

    return {
      Rfc: receptor.getAttribute("Rfc") || "",
      Nombre: receptor.getAttribute("Nombre") || "",
      RegimenFiscalReceptor: receptor.getAttribute("RegimenFiscalReceptor") || "",
      DomicilioFiscalReceptor: receptor.getAttribute("DomicilioFiscalReceptor") || "",
      Email: "",
      Calle: "",
      NumeroExterior: "",
      NumeroInterior: "",
      Colonia: "",
      Municipio: "",
      Estado: "",
    };
  };

  // ================================
  // Eliminar duplicados por RFC
  // ================================
  const eliminarDuplicados = (data) => {
    const mapa = new Map();

    data.forEach(item => {
      if (!mapa.has(item.Rfc)) {
        mapa.set(item.Rfc, item);
      }
    });

    const eliminados = data.length - mapa.size;

    if (eliminados > 0) {
      setToast({
        open: true,
        message: `Se eliminaron ${eliminados} duplicados`,
        severity: "info"
      });
    }

    return Array.from(mapa.values());
  };

  // ================================
  // Guardar Masivo
  // ================================
  const guardarMasivo = async () => {

    if (previewData.length === 0) {
      setToast({ open: true, message: "No hay datos para guardar", severity: "warning" });
      return;
    }

    setGuardando(true);

    try {
      for (const receptor of previewData) {
        await fetch(`${apiUrl}/api/gestores/RegistroReceptor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MTksImVtYWlsIjoiY3BnYXJjaWFfcm9tQGhvdG1haWwuY29tIiwiZXhwIjoxNzcxODA4MjkyfQ.QxJ4_g2pJiZMzjQ7y5ubNaV6V9CJD6foKBQTTlTd_sY`,
          },
          body: JSON.stringify({ Receptor: receptor }),
        });
      }

      setToast({ open: true, message: "Receptores guardados correctamente", severity: "success" });
      setPreviewData([]);
      setXmlFiles([]);

    } catch (error) {
      setToast({ open: true, message: "Error en el guardado", severity: "error" });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Box display="flex">
      {/* <SideBarMenu /> */}

      <Box flex={1} p={4}>
        <Typography variant="h5" mb={3}>
          Importar Receptores desde XML
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <input
            type="file"
            accept=".xml"
            multiple
            onChange={handleFileChange}
          />
        </Paper>

        {previewData.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Vista previa ({previewData.length} registros únicos)
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>RFC</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Régimen</TableCell>
                  <TableCell>C.P.</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.Rfc}</TableCell>
                    <TableCell>{item.Nombre}</TableCell>
                    <TableCell>{item.RegimenFiscalReceptor}</TableCell>
                    <TableCell>{item.DomicilioFiscalReceptor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box mt={3}>
              <Button
                variant="contained"
                onClick={guardarMasivo}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Confirmar y Guardar"}
              </Button>
            </Box>

            {guardando && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        )}

        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={() => setToast({ ...toast, open: false })}
        >
          <Alert severity={toast.severity} variant="filled">
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
