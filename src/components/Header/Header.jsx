"use client";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import Image from "next/image";
import UserMenu from "./UserMenu";
import FacturasPPD from "./FacturasPPD"
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/utils/authRedirect";
import { useRouter } from 'next/navigation';
import Layout from "../Layout";
import HelpIcon from '@mui/icons-material/Help';
import BadgeIcon from '@mui/icons-material/Badge';
import { Button, Tooltip, IconButton } from "@mui/material";


// Configuración de la fuente Inter
const inter = DM_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
});


// Opciones del dropdown para "Facturación"
const facturacionOptions = [
  { href: "/CrearFactura", label: "Nueva Factura" },
  { href: "/ImportarFacturas", label: "Importar Facturas" },
];

export default function Header() {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const token = isAuthenticated();
    if (!token) {
      router.push("/IniciaSesion");
    }
    else {
      setToken(token);
    }
  }, [router]);

  return (
    <header className="flex bg-gradient-wise items-center h-20 px-4 border-b shrink-0 md:px-6 rounded-none md:rounded-lg md:m-2">
      {/* Logo de la aplicación */}
      <Link
        href="/Home"
        className="flex items-center justify-center mr-6 pr-8"
        prefetch={false}
      >
        <Image
          src="/images/Log_blanco_wise_factura.png"
          alt="Descripción del logo"
          width={203}
          height={64}
        />
      </Link>

      {/* Menú de usuario */}
      <div className="ml-auto flex items-center gap-4">
        <Layout>
          <Tooltip title="Obtener Constancia de Datos fiscales">
            <IconButton
              component={Link}
              href="https://www.cloudb.sat.gob.mx/datos_fiscales/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "white" }}
            >
              <BadgeIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <HelpIcon fontSize="large" sx={{ color: "white" }} />
          <FacturasPPD token={token} />
          <UserMenu />
        </Layout>
      </div>
    </header>
  );
}
