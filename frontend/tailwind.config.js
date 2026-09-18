/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16232C",
        "ink-soft": "#5C6B73",
        paper: "#FBF8F2",
        "paper-dim": "#F1ECE1",
        amber: "#D9A441",
        "amber-dark": "#B5822B",
        signal: {
          green: "#3F9C6D",
          yellow: "#C79A2E",
          red: "#C1483D",
        },
        hairline: "#DCD5C4",
      },
      fontFamily: {
        serif: ["\"IBM Plex Serif\"", "Georgia", "serif"],
        sans: ["\"IBM Plex Sans\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
