import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",         // allows access from LANnpm
    port: 8085,         // the port Vite will run on
    allowedHosts: [
      "all",
      "e4500825722f.ngrok-free.app",
      "localhost",
      "127.0.0.1"
    ] // allow all external hosts, including ngrok
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
