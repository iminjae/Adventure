/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",     // ✅ Next App Router 기준 src 스캔
  ],
  theme: {
    extend: {
      colors: {
        bg: "#090d13",
        surface: "#0c121b",
        card: "#0f172a",
        border: "#1f2a3a",
        text: "#e5e7eb",
        muted: "#9aa5b1",
        primary: { DEFAULT: "#8b5cf6", 600: "#7c3aed" },
        success: "#10b981",
        warn: "#f59e0b",
        error: "#ef4444",
      },
      borderRadius: { xl: "14px" },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,58,237,.35), 0 8px 40px rgba(124,58,237,.15)",
        card: "0 2px 30px rgba(0,0,0,.35)",
      },
      fontFamily: {
        display: ["Cinzel", "ui-serif", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};