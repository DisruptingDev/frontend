export const metadata = {
  title: 'Wise Factura',
  description: 'Facturacion facil y rapida',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
