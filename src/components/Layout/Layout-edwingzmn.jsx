"use client";

import { Box } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/utils/authRedirect";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu.jsx";

export default function Layout({ children }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newUser, setNewUser] = useState(null);

  // Verificación de autenticación
  useEffect(() => {
    const token = isAuthenticated();
    if (!token) {
      router.push("/IniciaSesion");
    } else {
      setToken(token);
    }
  }, [router]);

  // Manejo de nuevo usuario
  useEffect(() => {
    const storedNewUser = localStorage.getItem('newUser');
    setNewUser(storedNewUser);
  }, []);

  return (
    <div>
      <Header token={token} />
      <Grid container>
        <Grid item xs={1}>
          <SideBarMenu />
        </Grid>
        <Grid item xs={11} sx={{ flexGrow: 1 }}>
          {children}
        </Grid>
      </Grid>
    </div>
  );
}