import './globals.css'; // Importa tus estilos globales

export const metadata = {
  title: 'Mi Aplicación',
  description: 'Descripción de mi aplicación',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme = "light">
      <body className = "bg-gray-200">
        {children}
      </body>
    </html>
  );
}
