import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
    hmr: {
      overlay: true,
    },
    // Add this if you're on Windows or having file watching issues
    watch: {
      usePolling: true,
    },
  },
});
