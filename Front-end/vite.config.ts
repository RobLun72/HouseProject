import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["msw/node"], // Exclude Node.js MSW from dependency optimization
    entries: [
      "src/**/*.{ts,tsx}", // Only scan src files, exclude test directory
      "!src/test/**/*", // Explicitly exclude test files
      "!**/*.test.{ts,tsx}",
      "!**/*.spec.{ts,tsx}",
    ],
  },
  // Exclude test files from build
  build: {
    rollupOptions: {
      external: ["msw/node"],
    },
  },
});
