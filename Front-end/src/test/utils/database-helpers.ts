// src/test/utils/database-helpers.ts
import { DatabaseQueries } from "../mocks/database/queries";
import { db, resetIdCounters } from "../mocks/database/db";

export class DatabaseTestHelpers {
  /**
   * Clear all data from the test database
   */
  static clearDatabase() {
    db.temperature.deleteMany({ where: {} });
    db.auditLog.deleteMany({ where: {} });
    db.room.deleteMany({ where: {} });
    db.house.deleteMany({ where: {} });
    db.user.deleteMany({ where: {} });
    // Reset ID counters to ensure consistent IDs across test runs
    resetIdCounters();
  }

  /**
   * Create a test house with optional rooms
   */
  static createTestHouse(houseData: {
    name: string;
    address?: string;
    rooms?: Array<{ name: string }>;
  }) {
    const house = DatabaseQueries.createHouse({
      name: houseData.name,
      address: houseData.address || null,
    });

    const rooms = [];
    if (houseData.rooms) {
      for (const roomData of houseData.rooms) {
        const room = DatabaseQueries.createRoom({
          name: roomData.name,
          houseId: house.houseId,
        });
        rooms.push(room);
      }
    }

    return { house, rooms };
  }

  /**
   * Create test temperature data for a room
   */
  static createTestTemperatures(
    roomId: number,
    temperatures: Array<{
      hour: number;
      degrees: number;
      date: string;
    }>
  ) {
    return temperatures.map((temp) =>
      DatabaseQueries.createTemperature({
        roomId,
        hour: temp.hour,
        degrees: temp.degrees,
        date: temp.date,
      })
    );
  }

  /**
   * Get all data for debugging tests
   */
  static getAllData() {
    return {
      houses: db.house.findMany({}),
      rooms: db.room.findMany({}),
      temperatures: db.temperature.findMany({}),
      users: db.user.findMany({}),
      auditLogs: db.auditLog.findMany({}),
    };
  }

  /**
   * Verify database state matches expectations
   */
  static verifyDatabaseState(expected: {
    houseCount?: number;
    roomCount?: number;
    temperatureCount?: number;
  }) {
    const actual = {
      houseCount: db.house.count(),
      roomCount: db.room.count(),
      temperatureCount: db.temperature.count(),
    };

    const checks = [];
    if (expected.houseCount !== undefined) {
      checks.push({
        name: "house count",
        expected: expected.houseCount,
        actual: actual.houseCount,
        matches: actual.houseCount === expected.houseCount,
      });
    }

    if (expected.roomCount !== undefined) {
      checks.push({
        name: "room count",
        expected: expected.roomCount,
        actual: actual.roomCount,
        matches: actual.roomCount === expected.roomCount,
      });
    }

    if (expected.temperatureCount !== undefined) {
      checks.push({
        name: "temperature count",
        expected: expected.temperatureCount,
        actual: actual.temperatureCount,
        matches: actual.temperatureCount === expected.temperatureCount,
      });
    }

    return {
      allMatch: checks.every((check) => check.matches),
      checks,
      actual,
    };
  }

  /**
   * Wait for database operations to complete (useful for async operations)
   */
  static async waitForDatabaseOperation(
    operation: () => Promise<unknown> | unknown
  ) {
    try {
      return await operation();
    } catch (error) {
      console.error("Database operation failed:", error);
      throw error;
    }
  }

  /**
   * Create a complete test scenario with house, rooms, and temperatures
   */
  static createCompleteTestScenario() {
    const { house, rooms } = this.createTestHouse({
      name: "Test House",
      address: "123 Test Street",
      rooms: [{ name: "Living Room" }, { name: "Kitchen" }],
    });

    const temperatures = [];
    if (rooms.length > 0) {
      // Add temperatures for the first room
      temperatures.push(
        ...this.createTestTemperatures(rooms[0].roomId, [
          { hour: 9, degrees: 20.5, date: "2024-01-15" },
          { hour: 12, degrees: 22.0, date: "2024-01-15" },
          { hour: 15, degrees: 21.5, date: "2024-01-15" },
        ])
      );
    }

    return {
      house,
      rooms,
      temperatures,
    };
  }
}
