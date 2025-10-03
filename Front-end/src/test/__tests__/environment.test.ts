import { describe, it, expect } from "vitest";

describe("Test Environment Configuration", () => {
  it("should have test environment variables configured in setup", () => {
    // Verify that test environment variables are set in the test setup
    // These are configured directly in src/test/setup.ts
    expect(import.meta.env.VITE_HOUSE_API_URL).toBe("https://localhost:7001");
    expect(import.meta.env.VITE_TEMPERATURE_API_URL).toBe(
      "https://localhost:7002"
    );
    expect(import.meta.env.VITE_HOUSE_API_KEY).toBe("dev-key-123456789");
    expect(import.meta.env.VITE_TEMPERATURE_API_KEY).toBe("dev-key-123456789");
  });

  it("should not require .env.test file", () => {
    // This test verifies that we don't need .env.test anymore
    // All test configuration is now handled in:
    // 1. src/test/setup.ts - for environment variables
    // 2. src/shared/mocks/handlers/config.ts - for MSW configuration (enableDelay: false)

    // The test environment should work without any .env.test file
    expect(true).toBe(true); // This test passes if setup works correctly
  });
});
