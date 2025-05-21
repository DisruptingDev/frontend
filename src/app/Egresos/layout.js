export const metadata = {
    title: 'Notas de Egreso',
    description: 'Generación de Notas de Egreso',
  }
  
  export default function RootLayout({ children }) {
    return (
      <html lang="es">
        <body>{children}</body>
      </html>
    )
  }