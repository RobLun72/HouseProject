import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Room } from "@/pages/Rooms/room";
import { RoomAdd } from "@/pages/Rooms/roomAdd";
import { RoomEdit } from "@/pages/Rooms/roomEdit";
import { ComponentTestHelpers } from "@/test/utils/component-test-helpers";
import { DatabaseTestHelpers } from "@/test/utils/database-helpers";
import { DatabaseQueries } from "@/shared/mocks/database/queries";
import { APIMockHelpers } from "@/test/utils/api-mock-helpers";
import userEvent from "@testing-library/user-event";

// Mock the environment variables using the reusable helper
APIMockHelpers.mockApiEnvVariables();

// Mock the responsive hook using the reusable helper
APIMockHelpers.mockResponsive();

// Helper function for consistent timeout across all tests
const waitForRoomsToLoad = async () => {
  await waitFor(
    () => {
      expect(screen.queryByText("Loading rooms...")).not.toBeInTheDocument();
    },
    { timeout: 15000 }
  );
};

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
        <Route path="/" element={<div>Home Page</div>} />
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
    vi.clearAllMocks();
    APIMockHelpers.restoreAllMocks();
  });

  describe("Complete Room Management Flow", () => {
    it("should load rooms from MSW data and display them in the table", async () => {
      // Setup test data
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for loading to complete with proper timeout
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify page title with house name
      expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();

      // Verify rooms are displayed
      expect(screen.getByText("Living Room")).toBeInTheDocument();
      expect(screen.getByText("Kitchen")).toBeInTheDocument();
      expect(screen.getByText("Master Bedroom")).toBeInTheDocument();
      expect(screen.getByText("Main Bathroom")).toBeInTheDocument();

      // Verify room details are shown
      expect(screen.getByText("Living")).toBeInTheDocument(); // Room type
      expect(screen.getByText("Cooking")).toBeInTheDocument(); // Kitchen type
      expect(screen.getByText("40")).toBeInTheDocument(); // Living room area
      expect(screen.getByText("25")).toBeInTheDocument(); // Kitchen area
    });

    it("should navigate to add room page when add button is clicked", async () => {
      // Setup initial data using the same pattern as successful timing tests
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 150,
      });

      DatabaseQueries.createRoom({
        name: "Living Room",
        houseId: house.houseId,
        type: "Living",
        area: 40,
        placement: "Ground Floor",
      });

      DatabaseQueries.createRoom({
        name: "Kitchen",
        houseId: house.houseId,
        type: "Cooking",
        area: 25,
        placement: "Ground Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load (longer timeout for both API calls)
      await waitForRoomsToLoad();

      // Find and click the add button
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      // Verify navigation to add page
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Verify form fields are present
      expect(screen.getByLabelText(/Room Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Room Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Area/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Placement/i)).toBeInTheDocument();
    });

    it("should add a new room and display it in the room table", async () => {
      const user = userEvent.setup();

      // Setup initial data with specific house and rooms
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Existing House",
        address: "100 Old Street",
        area: 180,
      });

      DatabaseQueries.createRoom({
        name: "Existing Room",
        houseId: house.houseId,
        type: "Living",
        area: 30,
        placement: "Ground Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load (longer timeout for both API calls)
      await waitForRoomsToLoad();

      // Verify existing room is displayed
      expect(screen.getByText("Existing Room")).toBeInTheDocument();

      // Navigate to add page
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      // Wait for add page to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText(/Room Name/i);
      const typeInput = screen.getByLabelText(/Room Type/i);
      const areaInput = screen.getByLabelText(/Area/i);
      const placementInput = screen.getByLabelText(/Placement/i);

      await user.clear(nameInput);
      await user.type(nameInput, "New Test Room");

      await user.clear(typeInput);
      await user.type(typeInput, "Bedroom");

      await user.clear(areaInput);
      await user.type(areaInput, "20");

      await user.clear(placementInput);
      await user.type(placementInput, "First Floor");

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

      // Wait for navigation back to room list
      await waitFor(
        () => {
          expect(
            screen.getByText("Rooms - Existing House")
          ).toBeInTheDocument();
          expect(screen.queryByText("Add New Room")).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Wait for rooms to load after navigation
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify both existing and new rooms are displayed
      expect(screen.getByText("Existing Room")).toBeInTheDocument();
      expect(screen.getByText("New Test Room")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument(); // New room area

      // Verify the new room was actually added to the database
      const allRooms = DatabaseQueries.getRoomsByHouseId(house.houseId);
      expect(allRooms).toHaveLength(2);

      const newRoom = allRooms.find((r) => r.name === "New Test Room");
      expect(newRoom).toBeDefined();
      expect(newRoom?.type).toBe("Bedroom");
      expect(newRoom?.area).toBe(20);
      expect(newRoom?.placement).toBe("First Floor");
    });

    it("should handle empty room list correctly", async () => {
      // Setup empty scenario with house but no rooms
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Empty House",
        address: "123 Empty Street",
        area: 100,
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for loading to complete with proper timeout
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify empty state is displayed
      expect(
        screen.getByText("No rooms found for Empty House.")
      ).toBeInTheDocument();

      // Verify add button is still available
      expect(screen.getByTestId("table-add-button")).toBeInTheDocument();
    });

    it("should handle missing house ID gracefully", async () => {
      // Use "null" as houseId which will be treated as missing by our error handling
      render(<TestApp initialRoute="/house/null/rooms" />);

      // Wait for component to render and show error
      await waitFor(
        () => {
          expect(screen.getByText(/Error:/)).toBeInTheDocument();
          expect(screen.getByText(/No house ID provided/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it("should handle API errors gracefully", async () => {
      // Setup scenario that will cause API error
      ComponentTestHelpers.createRoomScenarioForTesting();

      // Mock console.error to suppress expected error messages
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Mock fetch to throw an error
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<TestApp initialRoute="/house/1/rooms" />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // Restore original functions
      global.fetch = originalFetch;
      console.error = originalConsoleError;
    });

    it("should navigate back to houses when back button is clicked", async () => {
      // Setup test data
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load with proper timeout
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Find and click the back button
      const backButton = screen.getByText("← Back to Houses");
      fireEvent.click(backButton);

      // Verify navigation to home page
      await waitFor(() => {
        expect(screen.getByText("Home Page")).toBeInTheDocument();
      });
    });
  });

  describe("Room Edit Integration Tests", () => {
    it("should update room successfully from edit page", async () => {
      const user = userEvent.setup();

      // Setup initial data with a room to edit
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 150,
      });

      const existingRoom = DatabaseQueries.createRoom({
        name: "Original Room Name",
        houseId: house.houseId,
        type: "Living",
        area: 25,
        placement: "Ground Floor",
      });

      // Start directly on the edit page
      render(
        <TestApp
          initialRoute={`/house/${house.houseId}/rooms/edit/${existingRoom.roomId}`}
        />
      );

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit Room")).toBeInTheDocument();
      });

      // Verify form is pre-populated with existing data
      const nameInput = screen.getByDisplayValue("Original Room Name");
      const typeInput = screen.getByDisplayValue("Living");
      const areaInput = screen.getByDisplayValue("25");
      const placementInput = screen.getByDisplayValue("Ground Floor");

      expect(nameInput).toBeInTheDocument();
      expect(typeInput).toBeInTheDocument();
      expect(areaInput).toBeInTheDocument();
      expect(placementInput).toBeInTheDocument();

      // Update the room data
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Room Name");

      await user.clear(typeInput);
      await user.type(typeInput, "Bedroom");

      await user.clear(areaInput);
      await user.type(areaInput, "35");

      await user.clear(placementInput);
      await user.type(placementInput, "First Floor");

      // Submit the form
      const submitButton = screen.getByRole("button", {
        name: /update room/i,
      });
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
      await waitFor(
        () => {
          expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
          expect(screen.queryByText("Edit Room")).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Wait for rooms to load after navigation
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify the room was updated in the list
      expect(screen.getByText("Updated Room Name")).toBeInTheDocument();
      expect(screen.getByText("35")).toBeInTheDocument(); // Updated area

      // Verify the room was actually updated in the database
      const updatedRoom = DatabaseQueries.getRoomById(existingRoom.roomId);
      expect(updatedRoom?.name).toBe("Updated Room Name");
      expect(updatedRoom?.type).toBe("Bedroom");
      expect(updatedRoom?.area).toBe(35);
      expect(updatedRoom?.placement).toBe("First Floor");
    });

    it("should handle edit form validation errors", async () => {
      const user = userEvent.setup();

      // Setup initial data
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 100,
      });

      const existingRoom = DatabaseQueries.createRoom({
        name: "Test Room",
        houseId: house.houseId,
        type: "Living",
        area: 20,
        placement: "Ground Floor",
      });

      render(
        <TestApp
          initialRoute={`/house/${house.houseId}/rooms/edit/${existingRoom.roomId}`}
        />
      );

      // Wait for edit page to load
      await waitFor(() => {
        expect(screen.getByText("Edit Room")).toBeInTheDocument();
      });

      // Clear all fields to trigger validation
      const nameInput = screen.getByDisplayValue("Test Room");
      const typeInput = screen.getByDisplayValue("Living");
      const areaInput = screen.getByDisplayValue("20");
      const placementInput = screen.getByDisplayValue("Ground Floor");

      await user.clear(nameInput);
      await user.clear(typeInput);
      await user.clear(areaInput);
      await user.type(areaInput, "0");
      await user.clear(placementInput);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText("Room name is required")).toBeInTheDocument();
        expect(screen.getByText("Room type is required")).toBeInTheDocument();
        expect(
          screen.getByText("Area must be greater than 0")
        ).toBeInTheDocument();
        expect(screen.getByText("Placement is required")).toBeInTheDocument();
      });
    });

    it("should handle cancel and return to room list", async () => {
      // Setup initial data
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 100,
      });

      const existingRoom = DatabaseQueries.createRoom({
        name: "Test Room",
        houseId: house.houseId,
        type: "Living",
        area: 20,
        placement: "Ground Floor",
      });

      render(
        <TestApp
          initialRoute={`/house/${house.houseId}/rooms/edit/${existingRoom.roomId}`}
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
      await waitFor(
        () => {
          expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
          expect(screen.queryByText("Edit Room")).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Wait for rooms to load after navigation
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify original room data is unchanged
      expect(screen.getByText("Test Room")).toBeInTheDocument();
    });
  });

  describe("Room Delete Integration Tests", () => {
    it("should delete room through confirmation dialog successfully", async () => {
      // Setup test data
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 150,
      });

      DatabaseQueries.createRoom({
        name: "Room to Delete",
        houseId: house.houseId,
        type: "Living",
        area: 25,
        placement: "Ground Floor",
      });

      DatabaseQueries.createRoom({
        name: "Room to Keep",
        houseId: house.houseId,
        type: "Bedroom",
        area: 20,
        placement: "First Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify both rooms are displayed
      expect(screen.getByText("Room to Delete")).toBeInTheDocument();
      expect(screen.getByText("Room to Keep")).toBeInTheDocument();

      // Setup user event
      const user = userEvent.setup();

      // Find the context menu for the room to delete
      const contextMenuButtons = screen.getAllByTestId(/context-menu-trigger/);
      expect(contextMenuButtons.length).toBeGreaterThan(0);

      // Click the first context menu (should be for "Room to Delete" due to alphabetical sorting)
      await user.click(contextMenuButtons[0]);

      // Wait for context menu to appear
      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });

      // Click delete option
      const deleteOption = screen.getByText("Delete");
      await user.click(deleteOption);

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText("Delete Room")).toBeInTheDocument();
        expect(
          screen.getByText(
            'Are you sure you want to delete "Room to Delete"? This action cannot be undone.'
          )
        ).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByRole("button", { name: /delete$/i });
      fireEvent.click(confirmButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(
          screen.getByText("Room Deleted Successfully")
        ).toBeInTheDocument();
      });

      // Click OK in success dialog
      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Verify the room was deleted from the list
      await waitFor(() => {
        expect(screen.queryByText("Room to Delete")).not.toBeInTheDocument();
        expect(screen.getByText("Room to Keep")).toBeInTheDocument();
      });

      // Verify the room was actually deleted from the database
      const remainingRooms = DatabaseQueries.getRoomsByHouseId(house.houseId);
      expect(remainingRooms).toHaveLength(1);
      expect(remainingRooms[0].name).toBe("Room to Keep");
    });

    it("should cancel room deletion when cancel is clicked", async () => {
      // Setup test data
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
        area: 150,
      });

      const room = DatabaseQueries.createRoom({
        name: "Room to Maybe Delete",
        houseId: house.houseId,
        type: "Living",
        area: 25,
        placement: "Ground Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load
      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading rooms...")
          ).not.toBeInTheDocument();
        },
        { timeout: 15000 }
      );

      // Verify room is displayed
      expect(screen.getByText("Room to Maybe Delete")).toBeInTheDocument();

      // Setup user event
      const user = userEvent.setup();

      // Find and click context menu
      const contextMenuButton = screen.getByTestId(/context-menu-trigger/);
      await user.click(contextMenuButton);

      // Wait for context menu and click delete
      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Delete"));

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText("Delete Room")).toBeInTheDocument();
      });

      // Cancel deletion
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Verify room is still displayed
      await waitFor(() => {
        expect(screen.queryByText("Delete Room")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Room to Maybe Delete")).toBeInTheDocument();

      // Verify room still exists in database
      const roomInDb = DatabaseQueries.getRoomById(room.roomId);
      expect(roomInDb).not.toBeNull();
      expect(roomInDb?.name).toBe("Room to Maybe Delete");
    });
  });

  describe("Form Validation Tests", () => {
    it("should validate required fields in add form", async () => {
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms/add`} />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Since the form uses onChange validation mode, we need to interact with fields to trigger validation
      const nameInput = screen.getByLabelText(/Room Name/i);
      const typeInput = screen.getByLabelText(/Room Type/i);
      const areaInput = screen.getByLabelText(/Area/i);
      const placementInput = screen.getByLabelText(/Placement/i);

      // Enter some text and then clear it to trigger validation
      fireEvent.change(nameInput, { target: { value: "test" } });
      fireEvent.change(nameInput, { target: { value: "" } });

      fireEvent.change(typeInput, { target: { value: "test" } });
      fireEvent.change(typeInput, { target: { value: "" } });

      fireEvent.change(areaInput, { target: { value: "1" } });
      fireEvent.change(areaInput, { target: { value: "0" } });

      fireEvent.change(placementInput, { target: { value: "test" } });
      fireEvent.change(placementInput, { target: { value: "" } });

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText("Room name is required")).toBeInTheDocument();
        expect(screen.getByText("Room type is required")).toBeInTheDocument();
        expect(
          screen.getByText("Area must be greater than 0")
        ).toBeInTheDocument();
        expect(screen.getByText("Placement is required")).toBeInTheDocument();
      });
    });

    it("should validate field lengths and formats", async () => {
      const user = userEvent.setup();
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms/add`} />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill with invalid data
      const nameInput = screen.getByLabelText(/Room Name/i);
      const typeInput = screen.getByLabelText(/Room Type/i);
      const areaInput = screen.getByLabelText(/Area/i);
      const placementInput = screen.getByLabelText(/Placement/i);

      // Name too short
      await user.clear(nameInput);
      await user.type(nameInput, "A");

      // Type too short
      await user.clear(typeInput);
      await user.type(typeInput, "B");

      // Area too large
      await user.clear(areaInput);
      await user.type(areaInput, "100000");

      // Placement too short
      await user.clear(placementInput);
      await user.type(placementInput, "C");

      // Trigger validation by trying to submit
      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(
          screen.getByText("Room name must be at least 2 characters long")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Room type must be at least 2 characters long")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Area cannot exceed 10,000 sq ft")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Placement must be at least 2 characters long")
        ).toBeInTheDocument();
      });
    });
  });

  describe("User Experience Tests", () => {
    it("should show loading states during form submission", async () => {
      const user = userEvent.setup();
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms/add`} />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill out valid form
      const nameInput = screen.getByLabelText(/Room Name/i);
      const typeInput = screen.getByLabelText(/Room Type/i);
      const areaInput = screen.getByLabelText(/Area/i);
      const placementInput = screen.getByLabelText(/Placement/i);

      await user.clear(nameInput);
      await user.type(nameInput, "Loading Test Room");

      await user.clear(typeInput);
      await user.type(typeInput, "Office");

      await user.clear(areaInput);
      await user.type(areaInput, "15");

      await user.clear(placementInput);
      await user.type(placementInput, "Second Floor");

      // Mock slow API response
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (options?.method === "POST" && url.includes("/Room")) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      roomId: 999,
                      name: "Loading Test Room",
                      houseId: house.houseId,
                      type: "Office",
                      area: 15,
                      placement: "Second Floor",
                    }),
                }),
              1000
            )
          );
        }
        // For other requests, use the original fetch behavior
        return originalFetch(url, options);
      });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Verify loading state
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
        { timeout: 2000 }
      );

      // Restore original fetch
      global.fetch = originalFetch;
    });

    it("should allow canceling form and returning to room list", async () => {
      const { house } = ComponentTestHelpers.createRoomScenarioForTesting();

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms/add`} />);

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should navigate back to room list
      await waitFor(
        () => {
          expect(screen.getByText("Rooms - Test House")).toBeInTheDocument();
          expect(screen.queryByText("Add New Room")).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });
  });

  describe("Data Persistence Tests", () => {
    it("should maintain room data between page navigations", async () => {
      // Start with some initial data
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Persistent House",
        address: "123 Persistent St",
        area: 160,
      });

      DatabaseQueries.createRoom({
        name: "Persistent Room 1",
        houseId: house.houseId,
        type: "Living",
        area: 30,
        placement: "Ground Floor",
      });

      DatabaseQueries.createRoom({
        name: "Persistent Room 2",
        houseId: house.houseId,
        type: "Bedroom",
        area: 25,
        placement: "First Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load using the working helper
      await waitForRoomsToLoad();

      // Verify rooms are displayed
      expect(screen.getByText("Persistent Room 1")).toBeInTheDocument();
      expect(screen.getByText("Persistent Room 2")).toBeInTheDocument();

      // Navigate to add page
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Cancel and go back
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Wait for navigation back to room list to complete
      await waitForRoomsToLoad();

      // Verify original rooms are still there
      expect(screen.getByText("Persistent Room 1")).toBeInTheDocument();
      expect(screen.getByText("Persistent Room 2")).toBeInTheDocument();
    });

    it("should sort rooms correctly after adding new ones", async () => {
      const user = userEvent.setup();

      // Create rooms in non-alphabetical order
      DatabaseTestHelpers.clearDatabase();
      const house = DatabaseQueries.createHouse({
        name: "Sort Test House",
        address: "999 Sort Street",
        area: 220,
      });

      DatabaseQueries.createRoom({
        name: "Zebra Room",
        houseId: house.houseId,
        type: "Living",
        area: 30,
        placement: "Ground Floor",
      });

      DatabaseQueries.createRoom({
        name: "Alpha Room",
        houseId: house.houseId,
        type: "Bedroom",
        area: 25,
        placement: "First Floor",
      });

      render(<TestApp initialRoute={`/house/${house.houseId}/rooms`} />);

      // Wait for rooms to load using the working helper
      await waitForRoomsToLoad();

      expect(screen.getByText("Alpha Room")).toBeInTheDocument();
      expect(screen.getByText("Zebra Room")).toBeInTheDocument();

      // Add a room that should appear in the middle
      const addButton = screen.getByTestId("table-add-button");
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Room")).toBeInTheDocument();
      });

      // Fill form with "Middle Room"
      const nameInput = screen.getByLabelText(/Room Name/i);
      const typeInput = screen.getByLabelText(/Room Type/i);
      const areaInput = screen.getByLabelText(/Area/i);
      const placementInput = screen.getByLabelText(/Placement/i);

      await user.clear(nameInput);
      await user.type(nameInput, "Middle Room");

      await user.clear(typeInput);
      await user.type(typeInput, "Office");

      await user.clear(areaInput);
      await user.type(areaInput, "20");

      await user.clear(placementInput);
      await user.type(placementInput, "Ground Floor");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save room/i });
      fireEvent.click(submitButton);

      // Handle success dialog
      await waitFor(() => {
        expect(screen.getByText("Room Saved Successfully")).toBeInTheDocument();
      });

      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      // Wait for navigation back to room list to complete
      await waitForRoomsToLoad();

      // Verify all rooms are present and sorted correctly
      expect(screen.getByText("Alpha Room")).toBeInTheDocument();
      expect(screen.getByText("Middle Room")).toBeInTheDocument();
      expect(screen.getByText("Zebra Room")).toBeInTheDocument();

      // Verify sorting order by checking they appear in alphabetical order in the DOM
      const roomElements = screen.getAllByText(/Room$/);
      const roomNames = roomElements.map((el) => el.textContent);

      // Filter to only our test rooms and verify they're in alphabetical order
      const testRooms = roomNames.filter(
        (name) =>
          name === "Alpha Room" ||
          name === "Middle Room" ||
          name === "Zebra Room"
      );

      expect(testRooms[0]).toBe("Alpha Room");
      expect(testRooms[1]).toBe("Middle Room");
      expect(testRooms[2]).toBe("Zebra Room");
    });
  });
});
