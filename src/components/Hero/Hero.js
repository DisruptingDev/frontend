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
  height: 450,
  marginTop: '1rem',
  borderRadius: (theme.vars || theme).shape.borderRadius,
  outline: "6px solid",
  outlineColor: "hsla(220, 25%, 80%, 0.2)",
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.grey[200],
  boxShadow: "0 0 12px 8px hsla(220, 25%, 80%, 0.2)",
  backgroundImage: 'url(../../images/cover-wise-IA.jpg)',
  backgroundSize: "cover",
  [theme.breakpoints.up("sm")]: {
    marginTop: theme.spacing(0),
    height: 700,
  },
  ...theme.applyStyles("dark", {
    boxShadow: "0 0 24px 12px hsla(210, 100%, 25%, 0.2)",
    backgroundImage: `url(${process.env.TEMPLATE_IMAGE_URL || "https://mui.com"}/static/screenshots/material-ui/getting-started/templates/dashboard-dark.jpg)`,
    outlineColor: "hsla(220, 20%, 42%, 0.1)",
    borderColor: (theme.vars || theme).palette.grey[700],
  }),
}));

export default function Hero() {
  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: "100%",
        backgroundRepeat: "no-repeat",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(196, 100.00%, 19.60%), transparent)",
        ...theme.applyStyles("dark", {
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(194, 100.00%, 16.10%), transparent)",
        }),
      })}
    >
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: { xs: 14, sm: 20 },
          pb: { xs: 8, sm: 12 },
          marginBottom: '1rem',
        }}
      >
        <Stack
          spacing={2}
          useFlexGap
          sx={{ alignItems: "center", width: { xs: "100%", sm: "70%" } }}
        >
          <Typography
            variant="h2"
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              color: "white",
              fontSize: "clamp(3.5rem, 10vw, 3.5rem)",
              fontWeight: '700',
              textAlign: "center",
              
            }}
          >
            Timbres Fiscales CFDI 4.0: Simples, Rápidos y Confiables
            
          </Typography>
          <Typography
            sx={{
              textAlign: "center",
              color: "text.secondary",
              width: { sm: "100%", md: "80%" },
            }}
          >
             En Wise Facturación, te ofrecemos paquetes de timbres flexibles y el soporte que necesitas para una facturación electrónica sin complicaciones. ¡Cumplimiento SAT garantizado!
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: "100%", sm: "350px" } }}
          >
           
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ minWidth: "fit-content",  backgroundColor: '#10968A', marginBottom:'1rem'}}
            >
              Ver paquetes.
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              sx={{ minWidth: "fit-content",marginBottom:'1rem', }}
            >
              Más información
            </Button>
          </Stack>
          
        </Stack>
        <StyledBox id="image" />
      </Container>
    </Box>
  );
}
