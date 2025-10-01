// MSW v2 Node.js compatibility - override BroadcastChannel BEFORE any imports
// This prevents MSW from using the problematic Node.js native BroadcastChannel
class MockBroadcastChannel {
  public name: string;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onmessageerror: ((event: MessageEvent) => void) | null = null;

  constructor(name: string) {
    this.name = name;
  }

  postMessage(): void {
    // No-op for testing
  }

  close(): void {
    // No-op for testing
  }

  addEventListener(): void {
    // No-op for testing
  }

  removeEventListener(): void {
    // No-op for testing
  }

  dispatchEvent(): boolean {
    return true;
  }
}

// Override both global and globalThis to ensure complete coverage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.BroadcastChannel = MockBroadcastChannel as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).BroadcastChannel = MockBroadcastChannel as any;

import "@testing-library/jest-dom";
import { beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { server } from "../shared/mocks/server";
import { DatabaseTestHelpers } from "./utils/database-helpers";

// Start server before all tests
beforeAll(() => {
  // MSW v2 server configuration - more lenient for compatibility
  server.listen({
    onUnhandledRequest: "warn",
  });
  // Ensure we start with a clean database state
  DatabaseTestHelpers.clearDatabase();
  // Note: Not seeding initial data - let tests create what they need
});

// Ensure clean state before each test
beforeEach(() => {
  // Force aggressive database cleanup before each test
  DatabaseTestHelpers.forceResetDatabase();
  // Clear DOM to prevent element accumulation
  document.body.innerHTML = "";
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  // Force aggressive database cleanup after each test
  DatabaseTestHelpers.forceResetDatabase();
  // Clear DOM to prevent element accumulation
  document.body.innerHTML = "";
  // Note: Not seeding test data here - let each test create what it needs
});

// Clean up after all tests
afterAll(() => server.close());

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_TEMPERATURE_API_URL: "https://localhost:7002",
    VITE_TEMPERATURE_API_KEY: "dev-key-123456789",
    VITE_HOUSE_API_URL: "https://localhost:7001",
    VITE_HOUSE_API_KEY: "dev-key-123456789",
  },
  writable: true,
});
