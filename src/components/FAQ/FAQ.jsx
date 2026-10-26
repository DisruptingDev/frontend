'use client';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

const faqs = [
  {
    q: '¿Puedo facturar con varios RFC en una sola cuenta?',
    a: 'Sí. Wise Facturación cuenta con el sistema Multi RFC, ideal para contadores, administradores y empresarios. Puedes emitir, timbrar y gestionar comprobantes fiscales de personas físicas y morales desde una misma cuenta sin necesidad de cerrar sesión ni pagar suscripciones adicionales por cada RFC.',
  },
  {
    q: '¿Cuánto cuesta un timbre o folio CFDI 4.0?',
    a: 'El precio por folio va desde $0.77 MXN en compras por volumen hasta $11.60 MXN en paquetes iniciales de 25 folios. Todos los paquetes incluyen timbrado ilimitado con complementos SAT vigentes (pagos, nómina, carta porte) y timbrado en menos de 2 segundos.',
  },
  {
    q: '¿Los folios de facturación caducan?',
    a: 'No. En nuestros paquetes de folios, los timbres comprados no tienen vigencia ni caducan al término del mes o año. Se consumen únicamente cuando generas y timbras exitosamente tus CFDI.',
  },
  {
    q: '¿Cómo funciona la descarga masiva de XML y PDF del SAT?',
    a: 'A través de nuestro módulo de Descarga Masiva conectas tu e.firma (FIEL) o contraseña CIEC de forma 100% segura. El sistema solicita directamente al webservice del SAT tus facturas emitidas y recibidas, permitiéndote descargar paquetes completos de XML y PDF organizados.',
  },
  {
    q: '¿Wise permite timbrar recibos de nómina de forma masiva?',
    a: 'Sí. Puedes cargar los datos de tus colaboradores y percepciones/deducciones mediante plantillas en Excel o CSV. El sistema valida la información con el Complemento de Nómina 1.2 del SAT y timbra todos los recibos en lote en segundos.',
  },
  {
    q: '¿Cómo obtengo mis folios sin costo al registrarme?',
    a: 'Al registrar tu cuenta en Wise Facturación recibes folios de bienvenida sin costo para que pruebes el sistema, configures tu CSD y generes tus primeras facturas reales sin compromisos ni tarjetas de crédito forzosas.',
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box id="faq" sx={{ py: { xs: 8, sm: 12 }, backgroundColor: '#f8fafc', scrollMarginTop: '90px' }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: '#10968A', mb: 1 }}>
            <HelpOutlineRoundedIcon />
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Resuelve tus dudas
            </Typography>
          </Box>
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontWeight: 800, color: '#063F53', mb: 2 }}
          >
            Preguntas Frecuentes
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650, mx: 'auto' }}>
            Todo lo que necesitas saber sobre el timbrado CFDI 4.0, Multi RFC, paquetes de folios y compatibilidad con el SAT.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqs.map((faq, index) => {
            const panelId = `panel-${index}`;
            return (
              <Accordion
                key={index}
                expanded={expanded === panelId}
                onChange={handleChange(panelId)}
                sx={{
                  borderRadius: '16px !important',
                  border: '1px solid #e2e8f0',
                  boxShadow: expanded === panelId ? '0 10px 25px -5px rgba(0,0,0,0.07)' : 'none',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#10968A' }} />}
                  aria-controls={`${panelId}-content`}
                  id={`${panelId}-header`}
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: expanded === panelId ? 'rgba(16, 150, 138, 0.04)' : '#ffffff',
                  }}
                >
                  <Typography
                    component="h3"
                    sx={{
                      fontWeight: 700,
                      color: expanded === panelId ? '#10968A' : '#1e293b',
                      fontSize: '1.05rem',
                      m: 0,
                    }}
                  >
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, py: 2.5, backgroundColor: '#ffffff', color: '#475569', lineHeight: 1.7 }}>
                  <Typography variant="body1">{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
