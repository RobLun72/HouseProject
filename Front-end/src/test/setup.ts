import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./mocks/server";
import { DatabaseTestHelpers } from "./utils/database-helpers";

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  // Ensure we start with a clean database state
  DatabaseTestHelpers.clearDatabase();
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => server.close());

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_TEMPERATURE_API_URL: "http://localhost:5001/api",
    VITE_TEMPERATURE_API_KEY: "test-api-key",
    VITE_HOUSE_API_URL: "http://localhost:5000/api",
    VITE_HOUSE_API_KEY: "test-house-api-key",
  },
  writable: true,
});
