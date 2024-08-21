/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss/nesting': {},  // Añade la funcionalidad de anidamiento de Tailwind CSS
    tailwindcss: {},             // Mantiene Tailwind CSS
    autoprefixer: {}             // Añade Autoprefixer para compatibilidad con navegadores
  }
};

export default config;
