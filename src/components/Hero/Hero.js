import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FlashOnRoundedIcon from "@mui/icons-material/FlashOnRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { styled } from "@mui/material/styles";

const MockupContainer = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  maxWidth: "1120px",
  marginTop: "2.5rem",
  marginBottom: "1rem",
  borderRadius: "1.75rem",
  padding: "10px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 30px 80px -20px rgba(0, 30, 45, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.2)",
  [theme.breakpoints.up("sm")]: {
    borderRadius: "2.25rem",
    padding: "14px",
    marginTop: "3.5rem",
    marginBottom: "2rem",
  },
}));

const InnerMockup = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  height: 280,
  borderRadius: "1.25rem",
  overflow: "hidden",
  backgroundImage: "url(/images/cover-wise-IA.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
  [theme.breakpoints.up("sm")]: {
    height: 460,
    borderRadius: "1.75rem",
  },
  [theme.breakpoints.up("md")]: {
    height: 540,
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(6,63,83,0.15) 0%, rgba(6,63,83,0.45) 100%)",
    pointerEvents: "none",
  },
}));

export default function Hero() {
  return (
    <Box
      id="hero"
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "radial-gradient(ellipse 90% 70% at 50% -10%, #0c7682 0%, #063F53 60%, #032533 100%)",
        pt: { xs: 13, sm: 17, md: 19 },
        pb: { xs: 4, sm: 6 },
      }}
    >
      {/* Elementos ambientales de luz de fondo (glows) */}
      <Box
        sx={{
          position: "absolute",
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: { xs: "320px", sm: "600px", md: "800px" },
          height: { xs: "320px", sm: "400px", md: "500px" },
          background: "radial-gradient(circle, rgba(16, 150, 138, 0.45) 0%, rgba(6, 63, 83, 0) 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          left: "-5%",
          width: "350px",
          height: "350px",
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, rgba(6, 63, 83, 0) 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Chip de novedad / versión CFDI */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: { xs: 2, sm: 2.5 },
            py: 0.8,
            mb: 2.5,
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              color: "#ffffff",
            }}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
          </Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            CFDI 4.0 con Inteligencia y Multi RFC Centralizado
          </Typography>
        </Box>

        {/* Título Principal de Alto Impacto */}
        <Typography
          component="h1"
          sx={{
            color: "#ffffff",
            fontSize: {
              xs: "2.3rem",
              sm: "3.5rem",
              md: "4.2rem",
            },
            fontWeight: 900,
            textAlign: "center",
            lineHeight: { xs: 1.12, sm: 1.15 },
            letterSpacing: "-0.03em",
            maxWidth: "960px",
            textShadow: "0 2px 20px rgba(0,0,0,0.25)",
            mb: 2,
          }}
        >
          La forma más inteligente de facturar para{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(92deg, #5eead4 10%, #99f6e4 50%, #fef08a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            todos tus RFC
          </Box>
        </Typography>

        {/* Subtítulo descriptivo y persuasivo */}
        <Typography
          sx={{
            textAlign: "center",
            color: "rgba(240, 253, 250, 0.92)",
            maxWidth: "760px",
            fontSize: { xs: "1.02rem", sm: "1.2rem", md: "1.28rem" },
            lineHeight: 1.6,
            fontWeight: 400,
            mb: 3.5,
          }}
        >
          Emite facturas, nómina y complementos en segundos. Conexión directa al SAT,
          descarga masiva con FIEL y contabilidad electrónica en una sola plataforma sin plazos forzosos.
        </Typography>

        {/* Botones de Acción (CTA) */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 2 }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <Button
            variant="contained"
            size="large"
            href="/AltaUsuarios"
            startIcon={<CardGiftcardRoundedIcon />}
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "280px" },
              minHeight: "54px",
              backgroundColor: "#2dd4bf",
              color: "#042f2e",
              fontWeight: 800,
              fontSize: "1.05rem",
              borderRadius: "14px",
              px: 3.5,
              py: 1.5,
              textTransform: "none",
              boxShadow: "0 10px 30px -5px rgba(45, 212, 191, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
              transition: "all 0.25s ease-in-out",
              "&:hover": {
                backgroundColor: "#5eead4",
                transform: "translateY(-2px)",
                boxShadow: "0 15px 35px -5px rgba(45, 212, 191, 0.65)",
              },
            }}
          >
            Comienza gratis con folios de regalo
          </Button>

          <Button
            variant="outlined"
            size="large"
            href="#paquetes"
            sx={{
              width: { xs: "100%", sm: "auto" },
              minWidth: { sm: "180px" },
              minHeight: "54px",
              color: "#ffffff",
              borderColor: "rgba(255, 255, 255, 0.35)",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(8px)",
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: "14px",
              px: 3,
              py: 1.5,
              textTransform: "none",
              transition: "all 0.25s ease-in-out",
              "&:hover": {
                borderColor: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.18)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Ver paquetes y precios
          </Button>
        </Stack>

        {/* Micro-propuestas de valor (Pills) */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3 },
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: { xs: "0.85rem", sm: "0.92rem" },
            fontWeight: 500,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <CheckCircleRoundedIcon sx={{ color: "#34d399", fontSize: 18 }} />
            <span>Sin tarjeta requerida</span>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <FlashOnRoundedIcon sx={{ color: "#facc15", fontSize: 18 }} />
            <span>Timbrado en menos de 2 seg</span>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <BusinessRoundedIcon sx={{ color: "#38bdf8", fontSize: 18 }} />
            <span>Multi-empresa y Multi-usuario</span>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <ShieldRoundedIcon sx={{ color: "#a78bfa", fontSize: 18 }} />
            <span>PAC Autorizado SAT 100%</span>
          </Box>
        </Box>

        {/* Mockup Interactivo / Visual con tarjetas flotantes */}
        <MockupContainer>
          {/* Tarjeta flotante superior izquierda: Status SAT */}
          <Box
            className="hero-floating"
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              position: "absolute",
              top: "-22px",
              left: "24px",
              zIndex: 3,
              backgroundColor: "rgba(6, 63, 83, 0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(45, 212, 191, 0.4)",
              boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
              color: "#ffffff",
              py: 1.2,
              px: 2.2,
              borderRadius: "14px",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 10px #22c55e",
              }}
            />
            <Box>
              <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 500, lineHeight: 1 }}>
                Conexión Webservice SAT
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#ffffff", fontWeight: 700, mt: 0.2 }}>
                En línea • CFDI 4.0 Oficial
              </Typography>
            </Box>
          </Box>

          {/* Tarjeta flotante inferior derecha: Multi RFC rápido */}
          <Box
            className="hero-floating"
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              position: "absolute",
              bottom: "16px",
              right: "24px",
              zIndex: 3,
              backgroundColor: "rgba(6, 63, 83, 0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 14px 28px rgba(0, 0, 0, 0.35)",
              color: "#ffffff",
              py: 1.2,
              px: 2.2,
              borderRadius: "14px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: "10px",
                backgroundColor: "rgba(45, 212, 191, 0.2)",
                color: "#2dd4bf",
              }}
            >
              <BusinessRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", fontWeight: 500, lineHeight: 1 }}>
                Gestión Centralizada
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#ffffff", fontWeight: 700, mt: 0.2 }}>
                Ilimitados RFCs por cuenta
              </Typography>
            </Box>
          </Box>

          {/* Contenedor de la Imagen con aspecto de App UI */}
          <InnerMockup id="hero-preview" />
        </MockupContainer>
      </Container>
    </Box>
  );
}

