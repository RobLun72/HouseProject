import { describe, it, expect } from "vitest";

describe("Environment Configuration", () => {
  it("should load test environment variables correctly", () => {
    // Verify that test environment variables are loaded
    expect(import.meta.env.VITE_MSW_API_DELAY).toBe("0");
    expect(import.meta.env.VITE_ENABLE_MSW_MOCKING).toBe("true");
    expect(import.meta.env.VITE_MSW_WARN).toBe("false");

    // Verify API URLs are loaded
    expect(import.meta.env.VITE_HOUSE_API_URL).toBe("https://localhost:7001");
    expect(import.meta.env.VITE_TEMPERATURE_API_URL).toBe(
      "https://localhost:7002"
    );

    // Verify test API keys are loaded (different from development)
    expect(import.meta.env.VITE_HOUSE_API_KEY).toBe("dev-key-123456789");
    expect(import.meta.env.VITE_TEMPERATURE_API_KEY).toBe("dev-key-123456789");
  });
});
