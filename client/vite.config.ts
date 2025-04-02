import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Enhanced configuration for Vercel deployment with proper CSS handling
export default defineConfig({
  plugins: [
    react({
      // Enable CSS injection for Arco Design
      babel: {
        plugins: [
          ['import', { libraryName: '@arco-design/web-react', libraryDirectory: 'es', style: true }],
        ],
      },
    }),
  ],
  build: {
    outDir: "dist", // NOT dist/public - this is for Vercel deployment
    emptyOutDir: true,
    // Optimize the build for production
    minify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false,
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
  // Configure CSS preprocessing
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          // Theme customization for Arco Design if needed
        },
      },
    },
    modules: {
      localsConvention: 'camelCase',
    },
  },
});