/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0F1117",
        "bg-secondary": "#161B25",
        "bg-tertiary": "#1E2534",
        primary: "#6C63FF",
        secondary: "#00D4AA",
        highlight: "#8B5CF6",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-primary": "#E8EAF0",
        "text-secondary": "#8B90A0",
      },
      backdropBlur: {
        glass: "12px",
      },
      borderColor: {
        glass: "rgba(255,255,255,0.08)",
      },
      boxShadow: {
        glow: "0 0 15px rgba(108, 99, 255, 0.4)",
        "glow-sm": "0 0 10px rgba(108, 99, 255, 0.5)",
      },
    },
  },
  plugins: [],
};
