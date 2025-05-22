import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "client", "src") },
      { find: "@shared", replacement: resolve(__dirname, "shared") },
      { find: "@assets", replacement: resolve(__dirname, "attached_assets") },
    ],
  },
  root: resolve(__dirname, "client"),
  build: { outDir: resolve(__dirname, "dist/public"), emptyOutDir: true },
  server: {
    port: 4000,
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:5050',
      '/ws': {
        target: 'ws://127.0.0.1:5050',
        ws: true,
      },
    },
  },
});
