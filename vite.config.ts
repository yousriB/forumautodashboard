import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import serverConfig from "./vite.config.server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  ...serverConfig,
  server: {
    ...serverConfig.server,
    host: "::",
    port: 8080,
    strictPort: true,
    open: true,
  },
  preview: {
    ...serverConfig.preview,
    port: 8080,
    strictPort: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      ...(serverConfig.build?.rollupOptions || {}),
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
}));
