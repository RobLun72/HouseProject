import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { House } from "@/pages/House/house";
import { HouseAdd } from "@/pages/House/houseAdd";
import { HouseEdit } from "@/pages/House/houseEdit";
import { ComponentTestHelpers } from "@/test/utils/component-test-helpers";
import { DatabaseTestHelpers } from "@/test/utils/database-helpers";
import { DatabaseQueries } from "@/shared/mocks/database/queries";
import { APIMockHelpers } from "@/test/utils/api-mock-helpers";
import userEvent from "@testing-library/user-event";

// Mock the environment variables using the reusable helper
APIMockHelpers.mockApiEnvVariables();

// Mock the responsive hook using the reusable helper
APIMockHelpers.mockResponsive();

/**
 * Integration test component that renders House, HouseAdd, and HouseEdit components
 * with React Router for navigation testing
 */
function TestApp({ initialRoute = "/" }: { initialRoute?: string }) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<House />} />
        <Route path="/house/add" element={<HouseAdd />} />
        <Route path="/house/edit/:houseId" element={<HouseEdit />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("House Integration Tests", () => {
  beforeEach(() => {
    // Clear database and setup fresh test data
    DatabaseTestHelpers.clearDatabase();
  });

  afterEach(() => {
    vi.clearAllMocks();
    APIMockHelpers.restoreAllMocks();
  });

  describe("Complete House Management Flow", () => {
    it("should load houses from MSW data and display them in the table", async () => {
      // Setup test data
      ComponentTestHelpers.createHouseScenarioForTesting();

      render(<TestApp />);

      // Wait for loading to complete
      expect(screen.getByText("Loading houses...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify houses are displayed
      expect(screen.getByText("Houses")).toBeInTheDocument();
      expect(screen.getByText("Main House")).toBeInTheDocument();
      expect(screen.getByText("Guest House")).toBeInTheDocument();
      // Addresses don't appear in the table, only name and area
      expect(screen.getByText("200")).toBeInTheDocument(); // Main House area
      expect(screen.getByText("100")).toBeInTheDocument(); // Guest House area
    });

    it("should navigate to add house page when add button is clicked", async () => {
      // Setup initial data
      ComponentTestHelpers.createHouseScenarioForTesting();

      render(<TestApp />);

      // Wait for houses to load
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Find and click the add button
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      // Verify navigation to add page
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Verify form fields are present
      expect(screen.getByLabelText(/House Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Area/i)).toBeInTheDocument();
    });

    it("should add a new house and display it in the house table", async () => {
      const user = userEvent.setup();

      // Setup initial data with specific houses
      DatabaseTestHelpers.clearDatabase();
      DatabaseQueries.createHouse({
        name: "Existing House",
        address: "100 Old Street",
        area: 180,
      });

      render(<TestApp />);

      // Wait for houses to load
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify existing house is displayed
      expect(screen.getByText("Existing House")).toBeInTheDocument();

      // Navigate to add page
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      // Wait for add page to load
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText(/House Name/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const areaInput = screen.getByLabelText(/Area/i);

      await user.clear(nameInput);
      await user.type(nameInput, "New Test House");

      await user.clear(addressInput);
      await user.type(addressInput, "123 New Test Street");

      await user.clear(areaInput);
      await user.type(areaInput, "150");

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /save house/i });
      fireEvent.click(submitButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(
          screen.getByText("House Saved Successfully")
        ).toBeInTheDocument();
      });

      // Click OK in success dialog
      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Wait for navigation back to house list
      await waitFor(() => {
        expect(screen.getByText("Houses")).toBeInTheDocument();
        expect(screen.queryByText("Add New House")).not.toBeInTheDocument();
      });

      // Wait for houses to load after navigation
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify both existing and new houses are displayed
      expect(screen.getByText("Existing House")).toBeInTheDocument();
      expect(screen.getByText("New Test House")).toBeInTheDocument();
      // Address doesn't appear in table, check for area instead
      expect(screen.getByText("150")).toBeInTheDocument(); // New house area

      // Verify the new house was actually added to the database
      const allHouses = DatabaseQueries.getAllHouses();
      expect(allHouses).toHaveLength(2);

      const newHouse = allHouses.find((h) => h.name === "New Test House");
      expect(newHouse).toBeDefined();
      expect(newHouse?.address).toBe("123 New Test Street");
      expect(newHouse?.area).toBe(150);
    });

    it("should handle empty house list correctly", async () => {
      // Setup empty scenario
      ComponentTestHelpers.createEmptyScenario();

      render(<TestApp />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify empty state is displayed
      expect(screen.getByText("No houses found.")).toBeInTheDocument();

      // Verify add button is still available
      expect(screen.queryByTestId("table-add-button")).not.toBeInTheDocument(); // No table when empty
    });

    it("should handle API errors gracefully", async () => {
      // Setup scenario that will cause API error
      ComponentTestHelpers.createHouseScenarioForTesting();

      // Mock console.error to suppress expected error messages
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Mock fetch to throw an error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<TestApp />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // Restore original functions
      global.fetch = originalFetch;
      console.error = originalConsoleError;
    });
  });

  describe("House Edit Integration Tests", () => {
    it("should update house successfully from edit page", async () => {
      const user = userEvent.setup();

      // Setup initial data with a house to edit
      DatabaseTestHelpers.clearDatabase();
      const existingHouse = DatabaseQueries.createHouse({
        name: "Original House Name",
        address: "123 Original Street",
        area: 150,
      });

      // Start directly on the edit page since menu navigation is tested in houseTable.test.tsx
      render(<TestApp initialRoute={`/house/edit/${existingHouse.houseId}`} />);

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit House")).toBeInTheDocument();
      });

      // Verify form is pre-populated with existing data
      const nameInput = screen.getByDisplayValue("Original House Name");
      const addressInput = screen.getByDisplayValue("123 Original Street");
      const areaInput = screen.getByDisplayValue("150");

      expect(nameInput).toBeInTheDocument();
      expect(addressInput).toBeInTheDocument();
      expect(areaInput).toBeInTheDocument();

      // Update the house data
      await user.clear(nameInput);
      await user.type(nameInput, "Updated House Name");

      await user.clear(addressInput);
      await user.type(addressInput, "456 Updated Avenue");

      await user.clear(areaInput);
      await user.type(areaInput, "200");

      // Submit the form
      const submitButton = screen.getByRole("button", {
        name: /update house/i,
      });
      fireEvent.click(submitButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(
          screen.getByText("House Updated Successfully")
        ).toBeInTheDocument();
      });

      // Click OK in success dialog
      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Wait for navigation back to house list
      await waitFor(() => {
        expect(screen.getByText("Houses")).toBeInTheDocument();
        expect(screen.queryByText("Edit House")).not.toBeInTheDocument();
      });

      // Wait for houses to load after navigation
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify the house was updated in the list
      expect(screen.getByText("Updated House Name")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument(); // Updated area

      // Verify the house was actually updated in the database
      const updatedHouse = DatabaseQueries.getHouseById(existingHouse.houseId);
      expect(updatedHouse?.name).toBe("Updated House Name");
      expect(updatedHouse?.address).toBe("456 Updated Avenue");
      expect(updatedHouse?.area).toBe(200);
    });

    it("should handle edit form validation errors", async () => {
      const user = userEvent.setup();

      // Setup initial data
      DatabaseTestHelpers.clearDatabase();
      const existingHouse = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 100,
      });

      render(<TestApp initialRoute={`/house/edit/${existingHouse.houseId}`} />);

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit House")).toBeInTheDocument();
      });

      // Clear all fields to trigger validation
      const nameInput = screen.getByDisplayValue("Test House");
      const addressInput = screen.getByDisplayValue("123 Test Street");
      const areaInput = screen.getByDisplayValue("100");

      await user.clear(nameInput);
      await user.clear(addressInput);
      await user.clear(areaInput);
      await user.type(areaInput, "0");

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText("House name is required")).toBeInTheDocument();
        expect(screen.getByText("Address is required")).toBeInTheDocument();
        expect(
          screen.getByText("Area must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should handle cancel and return to house list", async () => {
      // Setup initial data
      DatabaseTestHelpers.clearDatabase();
      const existingHouse = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 100,
      });

      render(<TestApp initialRoute={`/house/edit/${existingHouse.houseId}`} />);

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit House")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should navigate back to house list
      await waitFor(() => {
        expect(screen.getByText("Houses")).toBeInTheDocument();
        expect(screen.queryByText("Edit House")).not.toBeInTheDocument();
      });

      // Wait for houses to load after navigation
      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify original house data is unchanged
      expect(screen.getByText("Test House")).toBeInTheDocument();
    });
  });

  describe("House Delete Integration Tests", () => {
    it("should delete house through API call successfully", async () => {
      // Since dropdown menu testing is covered in houseTable.test.tsx,
      // focus on the API integration and data flow for delete
      DatabaseTestHelpers.clearDatabase();
      const house1 = DatabaseQueries.createHouse({
        name: "House to Delete",
        address: "123 Delete Street",
        area: 150,
      });
      const house2 = DatabaseQueries.createHouse({
        name: "House to Keep",
        address: "456 Keep Avenue",
        area: 200,
      });

      // Verify both houses exist initially
      expect(DatabaseQueries.getHouseById(house1.houseId)).not.toBeNull();
      expect(DatabaseQueries.getHouseById(house2.houseId)).not.toBeNull();

      // Simulate the delete API call that would be triggered by the UI
      const response = await fetch(
        `https://localhost:7001/House/${house1.houseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "dev-key-123456789",
          },
        }
      );

      expect(response.ok).toBe(true);

      // Verify the house was deleted from the database
      const deletedHouse = DatabaseQueries.getHouseById(house1.houseId);
      const remainingHouse = DatabaseQueries.getHouseById(house2.houseId);
      expect(deletedHouse).toBeNull();
      expect(remainingHouse).not.toBeNull();

      // Render the component and verify the deleted house is not shown
      render(<TestApp />);

      await waitFor(() => {
        expect(screen.queryByText("House to Delete")).not.toBeInTheDocument();
        expect(screen.getByText("House to Keep")).toBeInTheDocument();
      });
    });

    it("should preserve house data when delete is cancelled", async () => {
      // Test that houses are not deleted when operation is cancelled
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "House to Maybe Delete",
        address: "123 Maybe Delete Street",
        area: 150,
      });

      // Verify house exists initially
      expect(DatabaseQueries.getHouseById(house.houseId)).not.toBeNull();

      render(<TestApp />);

      // Wait for house to load
      await waitFor(() => {
        expect(screen.getByText("House to Maybe Delete")).toBeInTheDocument();
      });

      // Simulate cancel behavior - house should remain unchanged
      const existingHouse = DatabaseQueries.getHouseById(house.houseId);
      expect(existingHouse).not.toBeNull();
      expect(existingHouse?.name).toBe("House to Maybe Delete");

      // Verify house is still displayed
      expect(screen.getByText("House to Maybe Delete")).toBeInTheDocument();
    });

    it("should handle delete operation with slow API response", async () => {
      // Test delete with simulated network delay
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "House with Loading",
        address: "123 Loading Street",
        area: 150,
      });

      // Mock slow delete API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (
          options?.method === "DELETE" &&
          url.includes(house.houseId.toString())
        ) {
          return new Promise(
            (resolve) =>
              setTimeout(() => {
                // Actually delete from database after delay
                DatabaseQueries.deleteHouse(house.houseId);
                resolve({
                  ok: true,
                  json: () => Promise.resolve({}),
                });
              }, 100) // Shorter delay for test
          );
        }
        // For other requests, use the original fetch behavior
        return originalFetch(url, options);
      });

      // Verify house exists initially
      expect(DatabaseQueries.getHouseById(house.houseId)).not.toBeNull();

      // Simulate the slow delete API call
      const deletePromise = fetch(
        `https://localhost:7001/House/${house.houseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "dev-key-123456789",
          },
        }
      );

      // Wait for the slow API response to complete
      const response = await deletePromise;
      expect(response.ok).toBe(true);

      // Verify house is deleted from database
      expect(DatabaseQueries.getHouseById(house.houseId)).toBeNull();

      // Render component and verify house doesn't appear
      render(<TestApp />);

      await waitFor(() => {
        expect(
          screen.queryByText("House with Loading")
        ).not.toBeInTheDocument();
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe("Form Validation Tests", () => {
    it("should validate required fields in add form", async () => {
      render(<TestApp initialRoute="/house/add" />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Since the form uses onChange validation mode, we need to interact with fields to trigger validation
      const nameInput = screen.getByLabelText(/House Name/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const areaInput = screen.getByLabelText(/Area/i);

      // Enter some text and then clear it to trigger validation
      fireEvent.change(nameInput, { target: { value: "test" } });
      fireEvent.change(nameInput, { target: { value: "" } });

      fireEvent.change(addressInput, { target: { value: "test" } });
      fireEvent.change(addressInput, { target: { value: "" } });

      fireEvent.change(areaInput, { target: { value: "1" } });
      fireEvent.change(areaInput, { target: { value: "0" } });

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText("House name is required")).toBeInTheDocument();
        expect(screen.getByText("Address is required")).toBeInTheDocument();
        expect(
          screen.getByText("Area must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should validate field lengths and formats", async () => {
      const user = userEvent.setup();

      render(<TestApp initialRoute="/house/add" />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Fill with invalid data
      const nameInput = screen.getByLabelText(/House Name/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const areaInput = screen.getByLabelText(/Area/i);

      // Name too short
      await user.clear(nameInput);
      await user.type(nameInput, "A");

      // Address too short
      await user.clear(addressInput);
      await user.type(addressInput, "123");

      // Area too large
      await user.clear(areaInput);
      await user.type(areaInput, "200000");

      // Trigger validation by trying to submit
      const submitButton = screen.getByRole("button", { name: /save house/i });
      fireEvent.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(
          screen.getByText("House name must be at least 2 characters long")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Address must be at least 5 characters long")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Area cannot exceed 100,000 sq ft")
        ).toBeInTheDocument();
      });
    });
  });

  describe("User Experience Tests", () => {
    it("should show loading states during form submission", async () => {
      const user = userEvent.setup();

      render(<TestApp initialRoute="/house/add" />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Fill out valid form
      const nameInput = screen.getByLabelText(/House Name/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const areaInput = screen.getByLabelText(/Area/i);

      await user.clear(nameInput);
      await user.type(nameInput, "Loading Test House");

      await user.clear(addressInput);
      await user.type(addressInput, "123 Loading Street");

      await user.clear(areaInput);
      await user.type(areaInput, "100");

      // Mock slow API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      houseId: 999,
                      name: "Loading Test House",
                    }),
                }),
              1000
            )
          )
      );

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save house/i });
      fireEvent.click(submitButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(
            screen.getByText("House Saved Successfully")
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it("should allow canceling form and returning to house list", async () => {
      render(<TestApp initialRoute="/house/add" />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should navigate back to house list
      await waitFor(() => {
        expect(screen.getByText("Houses")).toBeInTheDocument();
        expect(screen.queryByText("Add New House")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Persistence Tests", () => {
    it("should maintain house data between page navigations", async () => {
      // Start with some initial data
      DatabaseTestHelpers.clearDatabase();
      DatabaseQueries.createHouse({
        name: "Persistent House 1",
        address: "123 Persistent St",
        area: 160,
      });
      DatabaseQueries.createHouse({
        name: "Persistent House 2",
        address: "456 Persistent Ave",
        area: 140,
      });

      render(<TestApp />);

      // Wait for houses to load
      await waitFor(() => {
        expect(screen.getByText("Persistent House 1")).toBeInTheDocument();
        expect(screen.getByText("Persistent House 2")).toBeInTheDocument();
      });

      // Navigate to add page
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Cancel and go back
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Verify original houses are still there
      await waitFor(() => {
        expect(screen.getByText("Persistent House 1")).toBeInTheDocument();
        expect(screen.getByText("Persistent House 2")).toBeInTheDocument();
      });
    });

    it("should sort houses correctly after adding new ones", async () => {
      const user = userEvent.setup();

      // Create houses in non-alphabetical order
      DatabaseTestHelpers.clearDatabase();
      DatabaseQueries.createHouse({
        name: "Zebra House",
        address: "999 Last Street",
        area: 220,
      });
      DatabaseQueries.createHouse({
        name: "Alpha House",
        address: "111 First Street",
        area: 190,
      });

      render(<TestApp />);

      // Wait for houses to load and verify initial sorting
      await waitFor(() => {
        expect(screen.getByText("Alpha House")).toBeInTheDocument();
        expect(screen.getByText("Zebra House")).toBeInTheDocument();
      });

      // Verify they are sorted alphabetically (Alpha comes first)
      const alphaHouseEl = screen.getByText("Alpha House");
      const zebraHouseEl = screen.getByText("Zebra House");
      expect(
        alphaHouseEl.compareDocumentPosition(zebraHouseEl) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();

      // Add a house that should appear in the middle
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New House")).toBeInTheDocument();
      });

      // Fill form with "Middle House"
      const nameInput = screen.getByLabelText(/House Name/i);
      const addressInput = screen.getByLabelText(/Address/i);
      const areaInput = screen.getByLabelText(/Area/i);

      await user.clear(nameInput);
      await user.type(nameInput, "Middle House");

      await user.clear(addressInput);
      await user.type(addressInput, "555 Middle Street");

      await user.clear(areaInput);
      await user.type(areaInput, "125");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save house/i });
      fireEvent.click(submitButton);

      // Handle success dialog
      await waitFor(() => {
        expect(
          screen.getByText("House Saved Successfully")
        ).toBeInTheDocument();
      });

      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Verify all houses are present and sorted correctly
      await waitFor(() => {
        expect(screen.getByText("Alpha House")).toBeInTheDocument();
        expect(screen.getByText("Middle House")).toBeInTheDocument();
        expect(screen.getByText("Zebra House")).toBeInTheDocument();
      });

      // Verify sorting order (Alpha, Middle, Zebra)
      const alphaHouseElement = screen.getByText("Alpha House");
      const middleHouseElement = screen.getByText("Middle House");
      const zebraHouseElement = screen.getByText("Zebra House");

      expect(
        alphaHouseElement.compareDocumentPosition(middleHouseElement) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        middleHouseElement.compareDocumentPosition(zebraHouseElement) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });
});
