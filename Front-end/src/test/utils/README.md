# API Mock Helpers Usage Guide

The `APIMockHelpers` utility provides reusable methods for mocking API environment variables and responsive hooks in tests.

## Basic Usage

```typescript
import { APIMockHelpers } from "@/test/utils/api-mock-helpers";

// Mock with default values
APIMockHelpers.mockApiEnvVariables();
// Results in: { apiUrl: "https://localhost:7001", apiKey: "dev-key-123456789" }

// Mock with custom values
APIMockHelpers.mockApiEnvVariables({
  apiUrl: "https://my-test-api:8080",
  apiKey: "custom-test-key",
});
```

## Advanced Usage

```typescript
// Mock both House and Temperature APIs
APIMockHelpers.mockAllApiEnvVariables();

// Mock with different configs for each service
APIMockHelpers.mockAllApiEnvVariables(
  { apiUrl: "https://house-api:7001", apiKey: "house-key" },
  { apiUrl: "https://temp-api:7002", apiKey: "temp-key" }
);

// Mock error scenarios for testing
APIMockHelpers.mockApiErrorScenario("invalid-url");
APIMockHelpers.mockApiErrorScenario("missing-key");
APIMockHelpers.mockApiErrorScenario("wrong-port");
```

## Responsive Mocking

```typescript
// Mock responsive hook with default desktop view
APIMockHelpers.mockResponsive();
// Results in: { isMobile: false }

// Mock with custom responsive configuration
APIMockHelpers.mockResponsive({ isMobile: true });

// Shorthand methods for common scenarios
APIMockHelpers.mockMobileView(); // { isMobile: true }
APIMockHelpers.mockDesktopView(); // { isMobile: false }
```

## Cleanup

```typescript
// In afterEach or test cleanup
APIMockHelpers.restoreApiMocks(); // Restore API mocks only
APIMockHelpers.restoreResponsiveMocks(); // Restore responsive mocks only
APIMockHelpers.restoreAllMocks(); // Restore all mocks (recommended)
```

## Integration Example

```typescript
describe("Room Integration Tests", () => {
  beforeEach(() => {
    // Use default API and responsive mocks
    APIMockHelpers.mockApiEnvVariables();
    APIMockHelpers.mockResponsive(); // Default desktop view
  });

  afterEach(() => {
    vi.clearAllMocks();
    APIMockHelpers.restoreAllMocks(); // Restore all mocks
  });

  it("should handle custom configurations", () => {
    // Override with custom API config for specific test
    APIMockHelpers.mockApiEnvVariables({
      apiUrl: "https://staging-api:9000",
      apiKey: "staging-key",
    });

    // Test mobile responsive behavior
    APIMockHelpers.mockMobileView();

    // Your test code here...
  });

  it("should test responsive behavior", () => {
    // Test mobile layout
    APIMockHelpers.mockMobileView();
    // Render component and verify mobile-specific behavior

    // Switch to desktop layout within same test
    APIMockHelpers.mockDesktopView();
    // Re-render and verify desktop-specific behavior
  });
});
```

## Benefits

1. **Reusable**: No need to duplicate mock setup code
2. **Flexible**: Easy to customize API URLs, keys, and responsive behavior per test
3. **Maintainable**: Centralized configuration management
4. **Type Safe**: Full TypeScript support with proper typing
5. **Error Testing**: Built-in error scenario helpers
6. **Responsive Testing**: Easy mobile/desktop viewport switching
7. **Comprehensive**: Single utility for all common mocking needs
