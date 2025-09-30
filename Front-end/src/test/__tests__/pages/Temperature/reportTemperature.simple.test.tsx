// src/test/__tests__/pages/Temperature/reportTemperature.simple.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReportTemperature } from "../../../../pages/Temperature/reportTemperature";
import { DatabaseTestHelpers } from "../../../utils/database-helpers";

// Mock the environment variables hook
vi.mock("@/helpers/useTemperatureApiEnvVariables", () => ({
  useTemperatureApiEnvVariables: () => ({
    apiUrl: "http://localhost:5001/api",
    apiKey: "test-api-key",
  }),
}));

// Custom render function that includes router context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe("ReportTemperature Component - Simple Tests", () => {
  beforeEach(() => {
    // Setup base test data from JSON files (3 houses with proper room distribution)
    DatabaseTestHelpers.setupBaseData();
  });

  it("should render the component successfully", async () => {
    renderWithRouter(<ReportTemperature />);

    // Check if main heading is present
    expect(screen.getByText("Report Temperatures")).toBeInTheDocument();

    // Check if back link is present
    expect(screen.getByText("← Back to Temperature")).toBeInTheDocument();

    // Wait for the component to load houses from MSW
    await waitFor(
      () => {
        const houseText = screen.queryByText("Choose a house");
        const loadingText = screen.queryByText("Loading houses...");
        expect(houseText || loadingText).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("should have proper form structure", async () => {
    renderWithRouter(<ReportTemperature />);

    // Check for labels
    expect(screen.getByText("Select House")).toBeInTheDocument();
    expect(screen.getByText("Select Room")).toBeInTheDocument();
    expect(screen.getByText("Select Date")).toBeInTheDocument();

    // Wait for loading to complete, then check for combobox elements
    await waitFor(
      () => {
        expect(screen.getByText("Choose a house")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Check for combobox elements (should be 3)
    const comboboxes = screen.getAllByRole("combobox");
    expect(comboboxes).toHaveLength(3);
  });

  it("should display initial instruction text", async () => {
    renderWithRouter(<ReportTemperature />);

    // Wait for component to load
    await waitFor(
      () => {
        expect(screen.getByText("Choose a house")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(
      screen.getByText(
        "Select a house, room, and date to view temperature records."
      )
    ).toBeInTheDocument();
  });

  it("should have disabled room and date selects initially", async () => {
    renderWithRouter(<ReportTemperature />);

    // Wait for houses to load
    await waitFor(
      () => {
        expect(screen.getByText("Choose a house")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    const comboboxes = screen.getAllByRole("combobox");

    // Room and date selects should be disabled initially (no house selected)
    // Check if they have the disabled attribute or data-disabled attribute
    expect(comboboxes[1]).toHaveAttribute("data-disabled", "");
    expect(comboboxes[2]).toHaveAttribute("data-disabled", "");
  });

  it("should load houses from MSW on component mount", async () => {
    renderWithRouter(<ReportTemperature />);

    // Wait for houses to load and check that the house selector is ready
    await waitFor(
      () => {
        expect(screen.getByText("Choose a house")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // The component should have loaded successfully with MSW data
    expect(screen.getAllByRole("combobox")[0]).toBeInTheDocument();

    // Verify that our test house data is available
    // Note: The actual house options aren't visible until the dropdown is opened
    // But we can verify the dropdown is enabled and ready
    const houseSelect = screen.getAllByRole("combobox")[0];
    expect(houseSelect).not.toHaveAttribute("aria-disabled", "true");
  });

  it("should handle API errors gracefully", async () => {
    // Clear database to simulate no data scenario
    DatabaseTestHelpers.clearDatabase();

    renderWithRouter(<ReportTemperature />);

    // Wait for the component to finish loading
    await waitFor(
      () => {
        // With no houses in database, should still show the interface
        expect(screen.getByText("Choose a house")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Should still render the basic structure even with no data
    expect(screen.getByText("Report Temperatures")).toBeInTheDocument();
    expect(screen.getByText("Select House")).toBeInTheDocument();
  });
});
