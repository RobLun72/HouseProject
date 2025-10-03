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

// Fix React 18 concurrent features + jsdom compatibility issues
// Ensure window object is properly available for React state updates
Object.defineProperty(globalThis, "window", {
  value: globalThis.window || {},
  writable: true,
  configurable: true,
});

// Mock MessageChannel for React 18 concurrent features
if (!globalThis.MessageChannel) {
  class MockMessageChannel implements MessageChannel {
    port1 = {
      onmessage: null,
      onmessageerror: null,
      postMessage: () => {},
      close: () => {},
      start: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as MessagePort;
    port2 = {
      onmessage: null,
      onmessageerror: null,
      postMessage: () => {},
      close: () => {},
      start: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    } as MessagePort;
  }
  globalThis.MessageChannel = MockMessageChannel;
}

// Mock requestIdleCallback and cancelIdleCallback for React 18
if (!globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback = (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => {
    const timeout = options?.timeout || 0;
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      });
    }, timeout) as unknown as number;
  };
}

if (!globalThis.cancelIdleCallback) {
  globalThis.cancelIdleCallback = (id: number) => {
    clearTimeout(id);
  };
}

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
  // Clear database before each test
  DatabaseTestHelpers.clearDatabase();
  // Clear DOM to prevent element accumulation
  document.body.innerHTML = "";
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  // Clear database after each test
  DatabaseTestHelpers.clearDatabase();
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
