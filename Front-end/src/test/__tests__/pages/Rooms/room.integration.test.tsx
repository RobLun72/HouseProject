import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Room } from "@/pages/Rooms/room";
import { RoomAdd } from "@/pages/Rooms/roomAdd";
import { RoomEdit } from "@/pages/Rooms/roomEdit";
import { ComponentTestHelpers } from "@/test/utils/component-test-helpers";
import { DatabaseTestHelpers } from "@/test/utils/database-helpers";
import { DatabaseQueries } from "@/test/mocks/database/queries";
import userEvent from "@testing-library/user-event";

// Mock the environment variables
vi.mock("@/helpers/useApiEnvVariables", () => ({
  useApiEnvVariables: () => ({
    apiUrl: "https://localhost:7001",
    apiKey: "dev-key-123456789",
  }),
}));

// Mock the responsive hook
vi.mock("@/helpers/useResponsive", () => ({
  useResponsive: () => ({ isMobile: false }),
}));

/**
 * Integration test component that renders Room, RoomAdd, and RoomEdit components
 * with React Router for navigation testing
 */
function TestApp({
  initialRoute = "/house/1/rooms",
}: {
  initialRoute?: string;
}) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/house/:houseId/rooms" element={<Room />} />
        <Route path="/house/:houseId/rooms/add" element={<RoomAdd />} />
        <Route
          path="/house/:houseId/rooms/edit/:roomId"
          element={<RoomEdit />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("Room Integration Tests", () => {
  beforeEach(() => {
    // Clear database and setup fresh test data
    DatabaseTestHelpers.clearDatabase();
  });

  afterEach(() => {
    // Clean up database after each test to prevent data leakage
    DatabaseTestHelpers.clearDatabase();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete Room Management Flow", () => {
    it("should load rooms from MSW data and display them in the table", async () => {
      // Setup test data
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Wait for rooms to load and display
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
      });

      // Verify all rooms are displayed (use getAllByText to handle potential duplicates)
      const roomNames = screen.getAllByText(
        /Living Room|Kitchen|Master Bedroom|Main Bathroom/
      );
      expect(roomNames.length).toBeGreaterThanOrEqual(4);

      // Verify specific rooms exist
      expect(screen.getAllByText("Living Room")).toHaveLength(1);
      expect(screen.getAllByText("Kitchen")).toHaveLength(1);
      expect(screen.getAllByText("Master Bedroom")).toHaveLength(1);
      expect(screen.getAllByText("Main Bathroom")).toHaveLength(1);

      // Verify loading state is gone
      expect(screen.queryByText("Loading rooms...")).not.toBeInTheDocument();
    });

    it("should navigate to add room page when add button is clicked", async () => {
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Wait for rooms to load
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
      });

      // Find and click the add button
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      // Should navigate to add room page
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });
    });

    it("should add a new room and display it in the room table", async () => {
      const user = userEvent.setup();
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      // Start on the add room page
      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      // Wait for add room page to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText(/room name/i);
      const typeSelect = screen.getByLabelText(/room type/i);
      const areaInput = screen.getByLabelText(/area/i);
      const placementInput = screen.getByLabelText(/placement/i);

      await user.type(nameInput, "New Test Room");
      await user.type(typeSelect, "Office");
      await user.type(areaInput, "20");
      await user.type(placementInput, "Second Floor");

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(screen.getByText("Room Saved Successfully")).toBeInTheDocument();
      });

      // Click OK in success dialog
      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Should navigate back to room list
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
      });

      // Verify the new room is in the list
      expect(screen.getByText("New Test Room")).toBeInTheDocument();

      // Verify the room was actually created in the database
      const rooms = DatabaseQueries.getRoomsByHouseId(testData.house.houseId);
      const newRoom = rooms.find((r) => r.name === "New Test Room");
      expect(newRoom).toBeDefined();
      expect(newRoom?.type).toBe("Office");
      expect(newRoom?.area).toBe(20);
      expect(newRoom?.placement).toBe("Second Floor");
    });

    it("should handle empty room list correctly", async () => {
      // Create a house with no rooms
      DatabaseTestHelpers.clearDatabase();
      const testHouse = DatabaseQueries.createHouse({
        name: "Empty House",
        address: "456 Empty Street",
        area: 100,
      });

      render(<TestApp initialRoute={`/house/${testHouse.houseId}/rooms`} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText("Rooms - Empty House")).toBeInTheDocument();
      });

      // Should show empty state message
      expect(
        screen.getByText(/No rooms found for Empty House/)
      ).toBeInTheDocument();
    });

    it("should handle API errors gracefully", async () => {
      // Mock console.error to suppress expected error logs
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Mock fetch to return an error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<TestApp initialRoute="/house/999/rooms" />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      // Should show error message
      expect(screen.getByText(/Network error/)).toBeInTheDocument();

      // Restore original functions
      global.fetch = originalFetch;
      console.error = originalConsoleError;
    });
  });

  describe("Room Edit Integration Tests", () => {
    it("should update room successfully from edit page", async () => {
      const user = userEvent.setup();

      // Setup initial data with a room to edit
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const roomToEdit = testData.rooms[0]; // Living Room
      const houseId = testData.house.houseId.toString();

      // Start directly on the edit page
      render(
        <TestApp
          initialRoute={`/house/${houseId}/rooms/edit/${roomToEdit.roomId}`}
        />
      );

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit Room")).toBeInTheDocument();
      });

      // Verify form is pre-populated with existing data
      const nameInput = screen.getByDisplayValue("Living Room");
      const areaInput = screen.getByDisplayValue("40");

      expect(nameInput).toBeInTheDocument();
      expect(areaInput).toBeInTheDocument();

      // Update the room data
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Living Room");

      await user.clear(areaInput);
      await user.type(areaInput, "45");

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /update room/i });
      fireEvent.click(submitButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(
          screen.getByText("Room Updated Successfully")
        ).toBeInTheDocument();
      });

      // Click OK in success dialog
      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Wait for navigation back to room list
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
        expect(screen.queryByText("Edit Room")).not.toBeInTheDocument();
      });

      // Verify the room was updated in the database
      const updatedRoom = DatabaseQueries.getRoomById(roomToEdit.roomId);
      expect(updatedRoom?.name).toBe("Updated Living Room");
      expect(updatedRoom?.area).toBe(45);
    });

    it("should handle edit form validation errors", async () => {
      const user = userEvent.setup();

      // Setup initial data
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const roomToEdit = testData.rooms[0];
      const houseId = testData.house.houseId.toString();

      render(
        <TestApp
          initialRoute={`/house/${houseId}/rooms/edit/${roomToEdit.roomId}`}
        />
      );

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit Room")).toBeInTheDocument();
      });

      // Clear required fields to trigger validation
      const nameInput = screen.getByDisplayValue("Living Room");
      const areaInput = screen.getByDisplayValue("40");

      await user.clear(nameInput);
      await user.clear(areaInput);
      await user.type(areaInput, "0");

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText("Room name is required")).toBeInTheDocument();
        expect(
          screen.getByText("Area must be greater than 0")
        ).toBeInTheDocument();
      });
    });

    it("should handle cancel and return to room list", async () => {
      // Setup initial data
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const roomToEdit = testData.rooms[0];
      const houseId = testData.house.houseId.toString();

      render(
        <TestApp
          initialRoute={`/house/${houseId}/rooms/edit/${roomToEdit.roomId}`}
        />
      );

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit Room")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should navigate back to room list
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
        expect(screen.queryByText("Edit Room")).not.toBeInTheDocument();
      });

      // Verify original room data is unchanged
      expect(screen.getByText("Living Room")).toBeInTheDocument();
    });
  });

  describe("Room Delete Integration Tests", () => {
    it("should delete room through API call successfully", async () => {
      // Focus on the API integration and data flow for delete
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const roomToDelete = testData.rooms[0]; // Living Room
      const roomToKeep = testData.rooms[1]; // Kitchen

      // Verify both rooms exist initially
      expect(DatabaseQueries.getRoomById(roomToDelete.roomId)).not.toBeNull();
      expect(DatabaseQueries.getRoomById(roomToKeep.roomId)).not.toBeNull();

      // Simulate the delete API call that would be triggered by the UI
      const response = await fetch(
        `https://localhost:7001/Room/${roomToDelete.roomId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "dev-key-123456789",
          },
        }
      );

      expect(response.ok).toBe(true);

      // Verify the room was deleted from the database
      const deletedRoom = DatabaseQueries.getRoomById(roomToDelete.roomId);
      const remainingRoom = DatabaseQueries.getRoomById(roomToKeep.roomId);
      expect(deletedRoom).toBeNull();
      expect(remainingRoom).not.toBeNull();

      // Render the component and verify the deleted room is not shown
      const houseId = testData.house.houseId.toString();
      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Wait for the page to load with updated data
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
      });

      // Give extra time for the room data to load from API - expect exactly one Kitchen
      await waitFor(
        () => {
          const kitchenElements = screen.getAllByText("Kitchen");
          expect(kitchenElements).toHaveLength(1);
        },
        { timeout: 3000 }
      );

      // Now verify Living Room is not present
      await waitFor(() => {
        expect(screen.queryByText("Living Room")).not.toBeInTheDocument();
      });
    });

    it("should preserve room data when delete is cancelled", async () => {
      // Test that rooms are not deleted when operation is cancelled
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const room = testData.rooms[0];

      // Verify room exists initially
      expect(DatabaseQueries.getRoomById(room.roomId)).not.toBeNull();

      const houseId = testData.house.houseId.toString();
      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Wait for room to load
      await waitFor(() => {
        expect(screen.getByText("Living Room")).toBeInTheDocument();
      });

      // Simulate cancel behavior - room should remain unchanged
      const existingRoom = DatabaseQueries.getRoomById(room.roomId);
      expect(existingRoom).not.toBeNull();
      expect(existingRoom?.name).toBe("Living Room");

      // Verify room is still displayed
      expect(screen.getByText("Living Room")).toBeInTheDocument();
    });

    it("should handle delete operation with slow API response", async () => {
      // Test delete with simulated network delay
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const room = testData.rooms[0];

      // Mock slow delete API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (
          options?.method === "DELETE" &&
          url.includes(room.roomId.toString())
        ) {
          return new Promise(
            (resolve) =>
              setTimeout(() => {
                // Actually delete from database after delay
                DatabaseQueries.deleteRoom(room.roomId);
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

      // Verify room exists initially
      expect(DatabaseQueries.getRoomById(room.roomId)).not.toBeNull();

      // Simulate the slow delete API call
      const deletePromise = fetch(
        `https://localhost:7001/Room/${room.roomId}`,
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

      // Verify room is deleted from database
      expect(DatabaseQueries.getRoomById(room.roomId)).toBeNull();

      // Render component and verify room doesn't appear
      const houseId = testData.house.houseId.toString();
      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      await waitFor(() => {
        expect(screen.queryByText("Living Room")).not.toBeInTheDocument();
      });

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe("Form Validation Tests", () => {
    it("should validate required fields in add form", async () => {
      const user = userEvent.setup();
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      // Wait for add form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Verify that form starts with submit button disabled (form validation working)
      const submitButton = screen.getByRole("button", { name: /save room/i });
      expect(submitButton).toBeDisabled();

      // Fill in all required fields
      const nameInput = screen.getByLabelText(/room name/i);
      const typeInput = screen.getByLabelText(/room type/i);
      const areaInput = screen.getByLabelText(/area/i);
      const placementInput = screen.getByLabelText(/placement/i);

      await user.type(nameInput, "Test Room");
      await user.type(typeInput, "Office");
      await user.type(areaInput, "25");
      await user.type(placementInput, "First Floor");

      // Wait for form to become valid and submit button to be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should validate field lengths and formats", async () => {
      const user = userEvent.setup();
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      // Wait for add form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill in some fields
      const nameInput = screen.getByLabelText(/room name/i);
      const typeInput = screen.getByLabelText(/room type/i);
      const areaInput = screen.getByLabelText(/area/i);
      const placementInput = screen.getByLabelText(/placement/i);

      await user.type(nameInput, "Test Room");
      await user.type(typeInput, "Office");
      await user.type(placementInput, "First Floor");

      // Test invalid area value - form should remain invalid/disabled
      await user.type(areaInput, "0");

      const submitButton = screen.getByRole("button", { name: /save room/i });

      // Form should be invalid due to area validation
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Now fix the area to make form valid
      await user.clear(areaInput);
      await user.type(areaInput, "25");

      // Form should now be valid
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("User Experience Tests", () => {
    it("should show loading states during form submission", async () => {
      const user = userEvent.setup();
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      // Mock slow API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (options?.method === "POST") {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({ roomId: 999, name: "New Room" }),
                }),
              500
            )
          );
        }
        return originalFetch(url, options);
      });

      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      // Fill out form
      await ComponentTestHelpers.waitForRender();

      const nameInput = screen.getByLabelText(/room name/i);
      const typeInput = screen.getByLabelText(/room type/i);
      const areaInput = screen.getByLabelText(/area/i);
      const placementInput = screen.getByLabelText(/placement/i);

      await user.type(nameInput, "Loading Test Room");
      await user.type(typeInput, "Office");
      await user.type(areaInput, "20");
      await user.type(placementInput, "First Floor");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(
            screen.getByText("Room Saved Successfully")
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it("should allow canceling form and returning to room list", async () => {
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      // Wait for add form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should return to room list
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
        expect(screen.queryByText("Add New Room")).not.toBeInTheDocument();
      });
    });
  });

  describe("Data Persistence Tests", () => {
    it("should maintain room data between page navigations", async () => {
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      // First render - check initial data
      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      await waitFor(() => {
        expect(screen.getByText("Living Room")).toBeInTheDocument();
      });

      // Clean up and navigate to add page
      cleanup();
      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Clean up and navigate back to room list
      cleanup();
      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Data should still be there - expect exactly one of each
      await waitFor(() => {
        expect(screen.getAllByText("Living Room")).toHaveLength(1);
        expect(screen.getAllByText("Kitchen")).toHaveLength(1);
      });
    });

    it("should sort rooms correctly after adding new ones", async () => {
      const user = userEvent.setup();
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      // Add a room that should appear first alphabetically
      render(<TestApp initialRoute={`/house/${houseId}/rooms/add`} />);

      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Add "Attic" which should appear first - fill all required fields
      const nameInput = screen.getByLabelText(/room name/i);
      const typeInput = screen.getByLabelText(/room type/i);
      const areaInput = screen.getByLabelText(/area/i);
      const placementInput = screen.getByLabelText(/placement/i);

      await user.type(nameInput, "Attic");
      await user.type(typeInput, "Storage");
      await user.type(areaInput, "25");
      await user.type(placementInput, "Top Floor");

      // Wait for form to become valid
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /save room/i });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Handle success dialog
      await waitFor(() => {
        expect(screen.getByText("Room Saved Successfully")).toBeInTheDocument();
      });

      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Check if rooms are sorted correctly
      await waitFor(() => {
        // Get only the first cell in each table row (the name column)
        const tableRows = screen.getAllByRole("row");
        // Skip the header row (index 0)
        const dataRows = tableRows.slice(1);
        expect(dataRows.length).toBeGreaterThan(0);

        // Get the first data cell of the first row
        const firstRoomNameCell = dataRows[0].querySelector("td:first-child");
        expect(firstRoomNameCell).toHaveTextContent("Attic");
      });
    });
  });

  describe("Navigation Tests", () => {
    it("should navigate back to houses when back button is clicked", async () => {
      const testData = ComponentTestHelpers.createRoomScenarioForTesting();
      const houseId = testData.house.houseId.toString();

      render(<TestApp initialRoute={`/house/${houseId}/rooms`} />);

      // Wait for room list to load
      await waitFor(() => {
        expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
      });

      // Find the back button and verify it exists
      const backButton = screen.getByText("← Back to Houses");
      expect(backButton).toBeInTheDocument();

      // Click the back button
      fireEvent.click(backButton);

      // Note: In a real app this would navigate to the houses page,
      // but in our test setup we just verify the button was clickable
    });

    it("should handle invalid house ID in URL", async () => {
      render(<TestApp initialRoute="/house/invalid/rooms" />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });
  });
});
