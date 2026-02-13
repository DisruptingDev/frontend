import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";

import { styled } from "@mui/material/styles";

const StyledBox = styled("div")(({ theme }) => ({
  alignSelf: "center",
  width: "100%",
  height: 350,
  marginTop: '1rem',
  marginBottom: '-150px', // Pull image down on mobile
  borderRadius: "5rem",
  boxShadow: "4px 4px 8px 8px hsla(0, 0%, 24%, 0.20)",
  backgroundImage: 'url(../../images/cover-wise-IA.jpg)',
  backgroundSize: "cover",
  [theme.breakpoints.up("sm")]: {
    marginTop: theme.spacing(0),
    marginBottom: 0, // Reset margin on desktop
    height: 450,
  },
}));

export default function Hero() {
  return (
    <Box
      id="hero"
      className="bg-gradient-to-bl from-teal-400 to-cyan-700 mb-20" // Restore spacing to accommodate protruding image
      sx={(theme) => ({
        width: "100%",
        height: { xs: "100vh", sm: "75vh" },
      })}
    >
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: { xs: 14, sm: 20 },
          pb: { xs: 0, sm: 12 }, // Remove padding on mobile so background ends earlier
        }}
      >
        <Stack
          spacing={2}
          useFlexGap
          sx={{ alignItems: "center", width: 100 % { xs: "100%", sm: "70%" } }}
        >
          <Typography
            variant="h2"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              color: "white",
              fontSize: "clamp(5rem, 10vw, 5rem)",
              fontWeight: '700',
              textAlign: "center",

            }}
          >
            Factura en segundos y olvídate de los problemas

          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              color: "white",
              width: { sm: "100%", md: "80%" },
              fontSize: "clamp(1rem, 2vw, 1rem)",
            }}
          >
            La plataforma de facturación CFDI 4.0 diseñada para que PyMEs y contadores recuperen su tiempo. Empieza hoy sin contratos forzosos.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            sx={{
              pt: 2, width: { xs: "100%", sm: "350px" },
              justifyContent: "center"
            }}
          >

            <Button
              variant="contained"
              color="primary"
              size="large"
              href="#paquetes"
              sx={{ minWidth: "fit-content", backgroundColor: '#ffffff', color: '#10968A', marginBottom: '1rem' }}
            >
              Ver paquetes
            </Button>

          </Stack>

        </Stack>
        <StyledBox id="image" />
      </Container>
    </Box >
  );
}
