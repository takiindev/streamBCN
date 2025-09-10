import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5500,
    proxy: {
      '/auth': 'https://stream.bancongnghe.tech',
      '/admin': 'https://stream.bancongnghe.tech',
    }
  },
});
