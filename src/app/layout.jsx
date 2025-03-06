import './globals.css'; // Importa tus estilos globales

export const metadata = {
  title: 'Wise Factura | Inicio',
  description: 'Descripción de mi aplicación',
};

export default function VerticalLayout({ children }) {
  return (
    <html lang="es" >
      <body >
        {children}
      </body>
    </html>
  );
}
