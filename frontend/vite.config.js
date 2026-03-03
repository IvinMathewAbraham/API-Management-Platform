import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/auth": "http://localhost:5000",
      "/apikey": "http://localhost:5000",
      "/dashboard/usage": "http://localhost:5000",
      "/dashboard/analytics": "http://localhost:5000",
      "/user": "http://localhost:5000",
      "/api": "http://localhost:5000",
      "/admin": "http://localhost:5000",
      "/health": "http://localhost:5000",
    },
  },
});
