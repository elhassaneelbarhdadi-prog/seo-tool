/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

/* ✅ FIX __dirname (ESM) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({

  plugins: [react()],

  /* ========================= */
  /* ✅ ALIAS */
  /* ========================= */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"]
  },

  /* ========================= */
  /* DEV SERVER */
  /* ========================= */
  server: {
    port: 5173,
    open: false,
  },

  /* ========================= */
  /* BUILD */
  /* ========================= */
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },

  /* ========================= */
  /* PERF DEV */
  /* ========================= */
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },

});