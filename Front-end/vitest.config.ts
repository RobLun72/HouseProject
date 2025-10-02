import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env.test for testing
  const env = loadEnv(mode || "test", process.cwd(), "VITE_");

  return {
    plugins: [react()],
    define: {
      // Make environment variables available in tests
      ...Object.keys(env).reduce((prev, key) => {
        prev[`import.meta.env.${key}`] = JSON.stringify(env[key]);
        return prev;
      }, {} as Record<string, string>),
    },
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
  };
});
