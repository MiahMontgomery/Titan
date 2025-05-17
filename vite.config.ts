import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
  ) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

  return defineConfig({
    plugins,
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
        '/api': 'http://localhost:4000',
        '/ws': {
          target: 'ws://localhost:4000',
          ws: true,
        },
      },
    },
  });
};
