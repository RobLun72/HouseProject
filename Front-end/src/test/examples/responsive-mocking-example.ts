// Example showing how to use responsive mocking for mobile-specific testing

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { APIMockHelpers } from "@/test/utils/api-mock-helpers";

describe("Responsive Room Component Tests", () => {
  beforeEach(() => {
    APIMockHelpers.mockApiEnvVariables();
  });

  afterEach(() => {
    APIMockHelpers.restoreAllMocks();
  });

  it("should render desktop layout by default", () => {
    // Default responsive mock is desktop (isMobile: false)
    APIMockHelpers.mockDesktopView();
    // Component will render with desktop-specific styles/behavior
  });

  it("should render mobile layout when isMobile is true", () => {
    // Use shorthand for mobile view
    APIMockHelpers.mockMobileView();
    // Component will render with mobile-specific styles/behavior
  });

  it("should handle custom responsive configuration", () => {
    // Use custom configuration
    const config = APIMockHelpers.mockResponsive({ isMobile: true });
    expect(config.isMobile).toBe(true);
    // Component will use the custom responsive settings
  });

  it("should switch between mobile and desktop in same test", () => {
    // Start with mobile
    APIMockHelpers.mockMobileView();
    // Render and test mobile behavior...

    // Switch to desktop
    APIMockHelpers.mockDesktopView();
    // Re-render and test desktop behavior...
  });
});
