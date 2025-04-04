"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DM_Sans } from "next/font/google";
import Image from "next/image";
import UserMenu from "./UserMenu";
import FacturasPPD from "./FacturasPPD"
import { useState, useRef, useEffect } from "react";
import { Menu, MenuItem } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import { useRouter } from 'next/navigation';


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
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState(null);
  const timeoutRef = useRef(null);
  const isActive = (path) => pathname === path;
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

  const handleMouseEnter = (event) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setAnchorEl(null);
    }, 100); // Retraso de 300 ms antes de cerrar
  };

  return (
    <header className="flex m-2 bg-gradient-wise items-center h-20 px-4 border-b shrink-0 md:px-6 rounded-lg">
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

      {/* Navegación principal */}
      {/* <nav className="flex gap-4 sm:gap-6 text-sm font-medium relative">
        {links.map(({ href, label }) =>
          label === "Facturación" ? (
            <div
              key={href}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`text-white text-lg hover:underline underline-offset-4 ${
                  isActive(href)
                    ? "text-selected-color underline"
                    : "text-muted-foreground"
                }`}
             
              >
                {label} +
              </button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{
                  onMouseEnter: () => {
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current);
                    }
                  },
                  onMouseLeave: handleMouseLeave,
                }}
              >
                {facturacionOptions.map((option) => (
                  <MenuItem
                    key={option.href}
                    onClick={() => setAnchorEl(null)}
                    component={Link}
                    href={option.href}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          ) : (
            <Link
              key={href}
              href={href}
              className={`text-white text-lg hover:underline underline-offset-4 ${
                isActive(href)
                  ? "text-selected-color underline"
                  : "text-muted-foreground"
              }`}
              prefetch={false}
            >
              {label}
            </Link>
          )
        )}
      </nav> */}

      {/* Menú de usuario */}
      <div className="ml-auto flex items-center">
        <FacturasPPD token={token} />
        <UserMenu />
      </div>
    </header>
  );
}
