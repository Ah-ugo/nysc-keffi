import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest", srcDir: "src", filename: "sw.ts", registerType: "autoUpdate",
      manifest: {
        name: "NYSC Keffi Camp", short_name: "Keffi Camp", start_url: "/", display: "standalone", background_color: "#0f3d2a", theme_color: "#0f3d2a",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }],
      },
      injectManifest: { globPatterns: ["**/*.{js,css,html,png,svg}"] }, // static shell only; API data is never cached
    }),
  ],
});
