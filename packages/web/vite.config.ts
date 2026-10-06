import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        id: "/",
        name: "Rural Help",
        short_name: "Rural Help",
        description: "AI-assisted healthcare support for rural communities",
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        categories: ["health", "medical"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001"
    }
  }
});