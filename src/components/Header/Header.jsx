"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import Image from "next/image";
import UserMenu from "./UserMenu";

// Configuración de la fuente Inter
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Configuración dinámica de enlaces
const links = [
  { href: "/CrearFactura", label: "Facturación +" },
  { href: "/AltaCliente", label: "Clientes +" },
  { href: "/Empresas", label: "Empresas +" },
  { href: "/AltaSerie", label: "Series +" },
  { href: "/Timbres", label: "Timbres +" },
  { href: "/Conceptos", label: "Conceptos +" },
];

// Componente Header
export default function Header() {
  const pathname = usePathname();

  /**
   * Verifica si una ruta está activa
   * @param {string} path - La ruta a verificar
   * @returns {boolean} - Retorna true si la ruta actual coincide
   */
  const isActive = (path) => pathname === path;

  return (
    <header className="flex m-2 bg-primary-dark-total items-center h-20 px-4 border-b shrink-0 md:px-6 rounded-md">
      {/* Logo de la aplicación */}
      <Link
        href="/Home"
        className="flex items-center justify-center mr-6 pr-8"
        prefetch={false}
      >
        <Image
          src="/images/logo.png"
          alt="Descripción del logo"
          width={203}
          height={64}
        />
      </Link>

      {/* Navegación principal */}
      <nav className="flex gap-4 sm:gap-6 text-sm font-medium">
        {links.map(({ href, label }) => (
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
        ))}
      </nav>

      {/* Menú de usuario */}
      <UserMenu />
    </header>
  );
}
