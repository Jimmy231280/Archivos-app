/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brandBlue: "#1E4D8C",
        brandRed: "#A30D0A",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
