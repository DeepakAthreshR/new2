import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({

  base: './',

  plugins: [
    react(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      workbox: { clientsClaim: true, skipWaiting: true }
    })
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    sourcemap: false
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5030', // Points to Docker Nginx
        changeOrigin: true,
        secure: false,
        timeout: 300000, // ✅ 5 minute timeout for API calls
        proxyTimeout: 300000 
      },
      '/deploy': {
        target: 'http://localhost:5030', // Points to Docker Nginx
        changeOrigin: true,
        secure: false,
        timeout: 300000, // ✅ 5 minute timeout for deployments
        proxyTimeout: 300000 
      }
    }
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, "src/app")
    }
  }
});