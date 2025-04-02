import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Ultra-simple minimal configuration for Vercel deployment
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // NOT dist/public - this is for Vercel deployment
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "..", "shared")
    }
  },
  // Specify the public directory for assets
  publicDir: "public",
  // Specify the base URL for deployment
  base: "/",
});