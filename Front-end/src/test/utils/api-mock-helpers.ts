import { vi } from "vitest";

/**
 * Mock utilities for test scenarios including API environment variables and responsive hooks
 */
export class APIMockHelpers {
  /**
   * Default API configurations for different environments
   */
  static readonly DEFAULT_CONFIGS = {
    house: {
      apiUrl: "https://localhost:7001",
      apiKey: "dev-key-123456789",
    },
    temperature: {
      apiUrl: "https://localhost:7002",
      apiKey: "dev-key-123456789",
    },
  } as const;

  /**
   * Mock the useApiEnvVariables hook with custom or default values
   * @param config - Custom API configuration (optional)
   * @returns The mocked configuration
   */
  static mockApiEnvVariables(config?: { apiUrl?: string; apiKey?: string }) {
    const mockConfig = {
      apiUrl: config?.apiUrl ?? APIMockHelpers.DEFAULT_CONFIGS.house.apiUrl,
      apiKey: config?.apiKey ?? APIMockHelpers.DEFAULT_CONFIGS.house.apiKey,
    };

    vi.mock("@/helpers/useApiEnvVariables", () => ({
      useApiEnvVariables: () => mockConfig,
    }));

    return mockConfig;
  }

  /**
   * Mock the useTemperatureApiEnvVariables hook with custom or default values
   * @param config - Custom API configuration (optional)
   * @returns The mocked configuration
   */
  static mockTemperatureApiEnvVariables(config?: {
    apiUrl?: string;
    apiKey?: string;
  }) {
    const mockConfig = {
      apiUrl:
        config?.apiUrl ?? APIMockHelpers.DEFAULT_CONFIGS.temperature.apiUrl,
      apiKey:
        config?.apiKey ?? APIMockHelpers.DEFAULT_CONFIGS.temperature.apiKey,
    };

    vi.mock("@/helpers/useTemperatureApiEnvVariables", () => ({
      useTemperatureApiEnvVariables: () => mockConfig,
    }));

    return mockConfig;
  }

  /**
   * Mock both API environment variables at once
   * @param houseConfig - House API configuration (optional)
   * @param temperatureConfig - Temperature API configuration (optional)
   * @returns Object containing both mocked configurations
   */
  static mockAllApiEnvVariables(
    houseConfig?: { apiUrl?: string; apiKey?: string },
    temperatureConfig?: { apiUrl?: string; apiKey?: string }
  ) {
    return {
      house: APIMockHelpers.mockApiEnvVariables(houseConfig),
      temperature:
        APIMockHelpers.mockTemperatureApiEnvVariables(temperatureConfig),
    };
  }

  /**
   * Mock the useResponsive hook with custom or default values
   * @param config - Responsive configuration (optional)
   * @returns The mocked responsive configuration
   */
  static mockResponsive(config?: { isMobile?: boolean }) {
    const mockConfig = {
      isMobile: config?.isMobile ?? false, // Default to desktop view
    };

    vi.mock("@/helpers/useResponsive", () => ({
      useResponsive: () => mockConfig,
    }));

    return mockConfig;
  }

  /**
   * Mock for mobile viewport testing
   * @returns The mobile responsive configuration
   */
  static mockMobileView() {
    return APIMockHelpers.mockResponsive({ isMobile: true });
  }

  /**
   * Mock for desktop viewport testing
   * @returns The desktop responsive configuration
   */
  static mockDesktopView() {
    return APIMockHelpers.mockResponsive({ isMobile: false });
  }

  /**
   * Restore all API environment variable mocks
   */
  static restoreApiMocks() {
    vi.unmock("@/helpers/useApiEnvVariables");
    vi.unmock("@/helpers/useTemperatureApiEnvVariables");
  }

  /**
   * Restore responsive hook mocks
   */
  static restoreResponsiveMocks() {
    vi.unmock("@/helpers/useResponsive");
  }

  /**
   * Restore all mocks (API and responsive)
   */
  static restoreAllMocks() {
    APIMockHelpers.restoreApiMocks();
    APIMockHelpers.restoreResponsiveMocks();
  }

  /**
   * Create a mock with different API URLs for testing error scenarios
   * @param scenario - The error scenario to simulate
   */
  static mockApiErrorScenario(
    scenario: "invalid-url" | "missing-key" | "wrong-port"
  ) {
    switch (scenario) {
      case "invalid-url":
        return APIMockHelpers.mockApiEnvVariables({
          apiUrl: "invalid-url",
          apiKey: "dev-key-123456789",
        });
      case "missing-key":
        return APIMockHelpers.mockApiEnvVariables({
          apiUrl: "https://localhost:7001",
          apiKey: "",
        });
      case "wrong-port":
        return APIMockHelpers.mockApiEnvVariables({
          apiUrl: "https://localhost:9999",
          apiKey: "dev-key-123456789",
        });
      default:
        throw new Error(`Unknown error scenario: ${scenario}`);
    }
  }
}
