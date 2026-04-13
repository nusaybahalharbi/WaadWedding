/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          cream: "#FAF7F2",
          gold: "#C9A96E",
          "gold-light": "#E8D5B0",
          "gold-dark": "#A88542",
          charcoal: "#2D2D2D",
          taupe: "#8B7D6B",
          rose: "#D4A5A5",
          "rose-light": "#F0E0E0",
        },
      },
      fontFamily: {
        arabic: ['"Noto Naskh Arabic"', '"Amiri"', "serif"],
        display: ['"Playfair Display"', "serif"],
        body: ['"Lato"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
