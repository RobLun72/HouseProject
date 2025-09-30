// src/test/utils/component-test-helpers.ts
import { DatabaseTestHelpers } from "./database-helpers";
import { DatabaseQueries } from "../mocks/database/queries";
import { vi, expect } from "vitest";

/**
 * Test helpers specific to component testing with realistic scenarios
 */
export class ComponentTestHelpers {
  /**
   * Create a complete house scenario for testing
   */
  static createHouseScenarioForTesting() {
    // Clear database first
    DatabaseTestHelpers.clearDatabase();

    // Create houses with rooms
    const mainHouse = DatabaseQueries.createHouse({
      name: "Main House",
      address: "123 Main Street",
      area: 200,
    });

    const guestHouse = DatabaseQueries.createHouse({
      name: "Guest House",
      address: "456 Guest Lane",
      area: 100,
    });

    // Create rooms for main house
    const livingRoom = DatabaseQueries.createRoom({
      name: "Living Room",
      houseId: mainHouse.houseId,
    });

    const kitchen = DatabaseQueries.createRoom({
      name: "Kitchen",
      houseId: mainHouse.houseId,
    });

    const bedroom = DatabaseQueries.createRoom({
      name: "Master Bedroom",
      houseId: mainHouse.houseId,
    });

    // Create room for guest house
    const guestRoom = DatabaseQueries.createRoom({
      name: "Guest Room",
      houseId: guestHouse.houseId,
    });

    // Create temperature data for testing
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Living room temperatures - today
    const livingRoomTempsToday = [
      DatabaseQueries.createTemperature({
        roomId: livingRoom.roomId,
        hour: 8,
        degrees: 18.5,
        date: today,
      }),
      DatabaseQueries.createTemperature({
        roomId: livingRoom.roomId,
        hour: 12,
        degrees: 22.0,
        date: today,
      }),
      DatabaseQueries.createTemperature({
        roomId: livingRoom.roomId,
        hour: 18,
        degrees: 20.5,
        date: today,
      }),
    ];

    // Living room temperatures - yesterday
    const livingRoomTempsYesterday = [
      DatabaseQueries.createTemperature({
        roomId: livingRoom.roomId,
        hour: 9,
        degrees: 19.0,
        date: yesterday,
      }),
      DatabaseQueries.createTemperature({
        roomId: livingRoom.roomId,
        hour: 15,
        degrees: 23.5,
        date: yesterday,
      }),
    ];

    // Kitchen temperatures - today
    const kitchenTempsToday = [
      DatabaseQueries.createTemperature({
        roomId: kitchen.roomId,
        hour: 7,
        degrees: 17.0,
        date: today,
      }),
      DatabaseQueries.createTemperature({
        roomId: kitchen.roomId,
        hour: 19,
        degrees: 24.0,
        date: today,
      }),
    ];

    return {
      houses: [mainHouse, guestHouse],
      rooms: [livingRoom, kitchen, bedroom, guestRoom],
      temperatures: [
        ...livingRoomTempsToday,
        ...livingRoomTempsYesterday,
        ...kitchenTempsToday,
      ],
      dates: { today, yesterday },
    };
  }

  /**
   * Create room scenario for testing room components
   */
  static createRoomScenarioForTesting() {
    DatabaseTestHelpers.clearDatabase();

    // Create a test house first
    const testHouse = DatabaseQueries.createHouse({
      name: "Test House",
      address: "123 Test Street",
      area: 150,
    });

    // Create multiple rooms for the house
    const livingRoom = DatabaseQueries.createRoom({
      name: "Living Room",
      houseId: testHouse.houseId,
      type: "Living",
      area: 40,
      placement: "Ground Floor",
    });

    const kitchen = DatabaseQueries.createRoom({
      name: "Kitchen",
      houseId: testHouse.houseId,
      type: "Cooking",
      area: 25,
      placement: "Ground Floor",
    });

    const bedroom = DatabaseQueries.createRoom({
      name: "Master Bedroom",
      houseId: testHouse.houseId,
      type: "Bedroom",
      area: 30,
      placement: "First Floor",
    });

    const bathroom = DatabaseQueries.createRoom({
      name: "Main Bathroom",
      houseId: testHouse.houseId,
      type: "Bathroom",
      area: 10,
      placement: "Ground Floor",
    });

    return {
      house: testHouse,
      rooms: [livingRoom, kitchen, bedroom, bathroom],
    };
  }

  /**
   * Create empty scenario for testing empty states
   */
  static createEmptyScenario() {
    DatabaseTestHelpers.clearDatabase();
    return {
      houses: [],
      rooms: [],
      temperatures: [],
    };
  }

  /**
   * Create single house scenario for focused testing
   */
  static createSingleHouseScenario() {
    DatabaseTestHelpers.clearDatabase();

    const house = DatabaseQueries.createHouse({
      name: "Test House",
      address: "789 Test Avenue",
      area: 150,
    });

    const room = DatabaseQueries.createRoom({
      name: "Test Room",
      houseId: house.houseId,
    });

    const today = new Date().toISOString().split("T")[0];
    const temperature = DatabaseQueries.createTemperature({
      roomId: room.roomId,
      hour: 14,
      degrees: 21.0,
      date: today,
    });

    return {
      house,
      room,
      temperature,
      date: today,
    };
  }

  /**
   * Create edge case scenario with extreme data
   */
  static createEdgeCaseScenario() {
    DatabaseTestHelpers.clearDatabase();

    // House with very long name
    const house = DatabaseQueries.createHouse({
      name: "This is a very long house name that might cause display issues in the UI components",
      address: "123 Very Long Address Name That Might Overflow Street",
      area: 300,
    });

    // Room with special characters
    const room = DatabaseQueries.createRoom({
      name: 'Room with "Special" Characters & Symbols!',
      houseId: house.houseId,
    });

    // Extreme temperature values
    const today = new Date().toISOString().split("T")[0];
    const extremeTemps = [
      DatabaseQueries.createTemperature({
        roomId: room.roomId,
        hour: 0,
        degrees: -10.5, // Very cold
        date: today,
      }),
      DatabaseQueries.createTemperature({
        roomId: room.roomId,
        hour: 23,
        degrees: 45.0, // Very hot
        date: today,
      }),
    ];

    return {
      house,
      room,
      temperatures: extremeTemps,
      date: today,
    };
  }

  /**
   * Wait for async operations in components
   */
  static async waitForAsyncOperation(timeout = 1000) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  /**
   * Wait for components to render after interactions
   * @param timeout - Time to wait in milliseconds (default: 100ms)
   */
  static async waitForRender(timeout = 100) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  }

  /**
   * Mock responsive behavior for testing
   */
  static mockResponsive(isMobile: boolean) {
    // Mock the useResponsive hook behavior
    vi.mock("@/helpers/useResponsive", () => ({
      useResponsive: () => ({ isMobile }),
    }));
  }

  /**
   * Mock environment variables for API testing
   */
  static mockApiEnvironment() {
    return {
      apiUrl: "http://localhost:5001/api",
      apiKey: "test-api-key",
    };
  }

  /**
   * Create mock handlers for form testing
   */
  static createMockHandlers() {
    return {
      onAdd: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onViewRooms: vi.fn(),
      onUp: vi.fn(),
      onDown: vi.fn(),
    };
  }

  /**
   * Assert loading states
   */
  static assertLoadingState(element: HTMLElement, isLoading: boolean) {
    if (isLoading) {
      expect(element).toHaveTextContent(/loading/i);
    } else {
      expect(element).not.toHaveTextContent(/loading/i);
    }
  }

  /**
   * Assert error states
   */
  static assertErrorState(
    container: HTMLElement,
    hasError: boolean,
    errorMessage?: string
  ) {
    if (hasError) {
      expect(
        container.querySelector(".text-red-700, .border-red-200, .bg-red-50")
      ).toBeInTheDocument();
      if (errorMessage) {
        expect(container).toHaveTextContent(errorMessage);
      }
    } else {
      expect(
        container.querySelector(".text-red-700, .border-red-200, .bg-red-50")
      ).not.toBeInTheDocument();
    }
  }

  /**
   * Assert empty state displays
   */
  static assertEmptyState(container: HTMLElement, expectedMessage?: string) {
    const emptyStateElements = container.querySelectorAll(
      ".text-gray-500, .text-center"
    );
    expect(emptyStateElements.length).toBeGreaterThan(0);

    if (expectedMessage) {
      expect(container).toHaveTextContent(expectedMessage);
    }
  }
}
