"use client";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Importa usePathname para obtener la ruta actual
import { Inter } from "next/font/google";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function Header({ name }) {
  const pathname = usePathname(); // Obtiene la ruta actual

  // Función para determinar si una ruta está activa
  const isActive = (path) => pathname === path;

  return (
    <header className="flex m-2 bg-primary-dark-total items-center h-20 px-4 border-b shrink-0 md:px-6 rounded-md">
      <Link
        href="/Home"
        className="flex items-center justify-center mr-6 pr-8"
        prefetch={false}
      >
        <Image
          src="/images/logo.png"
          alt="Descripción de la imagen"
          width={203}
          height={64}
        />
      </Link>
      <nav className="flex gap-4 sm:gap-6 text-sm font-medium">
        <Link
          href="/CrearFactura"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/CrearFactura") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Facturación +
        </Link>
        <Link
          href="/AltaCliente"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/AltaCliente") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Clientes +
        </Link>
        <Link
          href="/Empresas"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/Empresas") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Empresas +
        </Link>
        <Link
          href="/AltaSerie"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/AltaSerie") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Series +
        </Link>
        <Link
          href="#"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/Conceptos") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Conceptos +
        </Link>
        <Link
          href="#"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/Estatus") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Estatus +
        </Link>
        {/* <Link
          href="/AltaEmpresa"
          className={`text-white text-lg hover:underline underline-offset-4 ${
            isActive("/AltaEmpresa") ? "text-selected-color underline" : "text-muted-foreground"
          }`}
          prefetch={false}
        >
          Alta de Empresa +
        </Link> */}
      </nav>
    </header>
  );
}

function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}
