/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F1",
        surface: "#F3EADB",
        ink: "#2A2622",
        muted: "#655E55",
        leaf: "#3E4A33",
        gold: "#B18B51",
        blush: "#F6E3DA",
        marula: "#E3A83E",
        tea: "#5B8A3C",
        treatment: "#6D58C9",
        argan: "#22385A",
        cocoa: "#7A4B3A"
      },
      fontFamily: {
        display: ["Newsreader Variable", "Georgia", "serif"],
        sans: ["Figtree Variable", "Arial", "sans-serif"]
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};
