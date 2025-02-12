import './globals.css'; // Importa tus estilos globales

export const metadata = {
  title: 'Mi Aplicación',
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
