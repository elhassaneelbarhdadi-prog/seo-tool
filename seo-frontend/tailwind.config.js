/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // 🔥 important pour SaaS

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#6366f1",   // indigo
        secondary: "#9333ea", // purple
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },

      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.05)",
        strong: "0 20px 50px rgba(0,0,0,0.15)",
      },

      animation: {
        fadeIn: "fadeIn 0.4s ease-in-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },

  plugins: [],
};