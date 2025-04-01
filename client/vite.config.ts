import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Ultra-simple minimal configuration for Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist"
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }
});