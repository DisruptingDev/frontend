"use client";

import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// (function(d,t) {
// 		var BASE_URL="http://chatwoot-rails-api-service:80";
// 		var CDN_URL="https://chat-widget.hiverhq.com/chat-widget";
// 		var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
// 		g.src=CDN_URL+"/js/sdk.js";
// 		g.defer = true;
// 		g.async = true;
// 		s.parentNode.insertBefore(g,s);
// 		g.onload=function(){
// 			window.chatwootSDK.run({
// 				websiteToken: 'BVzRWDgxipHacrSLUQ43pN8y',
// 				baseUrl: BASE_URL
// 			})
// 		}
// 	})(document,"script");


const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: "8px 12px",
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  useEffect(() => {
      const script = document.createElement('script')
      script.src = 'https://chat-widget.hiverhq.com/chat-widget/js/sdk.js'
      script.defer = true
      script.async = true
      script.onload = () => {
        window.chatwootSDK.run({
          websiteToken: 'BVzRWDgxipHacrSLUQ43pN8y',
          baseUrl: 'http://chatwoot-rails-api-service:80'
        })
      }
      document.body.appendChild(script)
      
      return () => {
        document.body.removeChild(script)
      }
    }, [])

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        backgroundColor: "#063F53",
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Link
            href="#"
            className="flex items-center justify-center mr-6 pr-8"
            prefetch={false}
          >
            <Image
              src="/images/Logo_wise_factura.png"
              alt="Wise Factura Logo"
              width={203}
              height={64}
              priority // Prioriza la carga de la imagen
            />
          </Link>
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}
          />
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              sx={{
                ml: 2,
                borderColor: "#063F53",
                color: "#063F53",
                "&:hover": {
                  backgroundColor: "rgba(16, 150, 138, 1)",
                  borderColor: "#ffffff",
                },
              }}
              onClick={() => router.push("/IniciaSesion")}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#10968A",
                ml: 2,
                "&:hover": {
                  backgroundColor: "#0398a6",
                },
              }}
              onClick={() => router.push("/AltaUsuarios")}
            >
              Registrarse
            </Button>
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            {/* <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton> */}
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#10968A",
                      ml: 2,
                      "&:hover": {
                        backgroundColor: "#0398a6",
                      },
                    }}
                    onClick={() => router.push("/AltaUsuarios")}
                  >
                    Registrarse
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button
                    variant="outlined"
                    color="inherit"
                    sx={{
                      ml: 2,
                      borderColor: "#ffffff",
                      color: "#ffffff",
                      "&:hover": {
                        backgroundColor: "rgba(16, 150, 138, 1)",
                        borderColor: "#ffffff",
                      },
                    }}
                    onClick={() => router.push("/IniciaSesion")}
                  >
                    Iniciar Sesión
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
