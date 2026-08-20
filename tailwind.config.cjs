/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // corePlugins: {
  //   preflight: false // Mantiene la configuración de deshabilitar preflight
  // },
  // important: '#__next', // Mantiene la configuración de importancia
  theme: {
      extend: {
        colors: {
            'primary-dark-total': '#1D394D',
            // 'selected-color': 'rgb(4, 178, 202)',
            'selected-color':  '#04B2CA'
        },
      },
  },
  plugins: [
    require('tailwindcss-logical'), 
    require('./src/@core/tailwind/plugin'), 
    require('daisyui')
  ],
  daisyui: {
    themes: ["light"], // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    base: false, // applies background color and foreground color for root element by default
    styled: true
  },
};
