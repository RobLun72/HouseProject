import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    globals: true,
    // Enable proper test isolation by running tests in separate processes
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false, // Allow multiple forks for better test isolation
        isolate: true, // Ensure each test file runs in isolation
      },
    },
    // Clean up between test files
    teardownTimeout: 1000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
