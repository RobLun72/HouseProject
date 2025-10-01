// src/test/__tests__/database-integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseQueries } from "../../shared/mocks/database/queries";
import { DatabaseTestHelpers } from "../utils/database-helpers";

describe("Database Integration Tests", () => {
  beforeEach(() => {
    // Clear database before each test to ensure isolation
    DatabaseTestHelpers.clearDatabase();
  });

  describe("House Operations", () => {
    it("should create and retrieve houses", () => {
      // Create a test house
      const house = DatabaseQueries.createHouse({
        name: "Test House",
        address: "123 Test Street",
      });

      expect(house).toEqual(
        expect.objectContaining({
          houseId: expect.any(Number),
          name: "Test House",
          address: "123 Test Street",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        })
      );

      // Also check individual properties to be more explicit
      expect(house.name).toBe("Test House");
      expect(house.address).toBe("123 Test Street");
      expect(typeof house.houseId).toBe("number");

      // Retrieve all houses
      const houses = DatabaseQueries.getAllHouses();
      expect(houses).toHaveLength(1);
      expect(houses[0]).toEqual(house);
    });

    it("should create houses with rooms", () => {
      const { house, rooms } = DatabaseTestHelpers.createTestHouse({
        name: "Test House",
        rooms: [{ name: "Living Room" }, { name: "Kitchen" }],
      });

      expect(house.name).toBe("Test House");
      expect(rooms).toHaveLength(2);
      expect(rooms[0].name).toBe("Living Room");
      expect(rooms[1].name).toBe("Kitchen");

      // Verify relationships
      const housesWithRooms = DatabaseQueries.getHousesWithRooms();

      expect(housesWithRooms).toHaveLength(1);
      expect(housesWithRooms[0].rooms).toHaveLength(2);
    });
  });

  describe("Temperature Operations", () => {
    it("should create and query temperature data", () => {
      // Setup: Create a house with room
      const { rooms } = DatabaseTestHelpers.createTestHouse({
        name: "Test House",
        rooms: [{ name: "Living Room" }],
      });

      const roomId = rooms[0].roomId;

      // Create temperature data
      const temperatures = DatabaseTestHelpers.createTestTemperatures(roomId, [
        { hour: 9, degrees: 20.5, date: "2024-01-15" },
        { hour: 12, degrees: 22.0, date: "2024-01-15" },
        { hour: 15, degrees: 21.5, date: "2024-01-15" },
      ]);

      expect(temperatures).toHaveLength(3);

      // Query temperatures
      const roomTemperatures = DatabaseQueries.getTemperaturesByRoomAndDate(
        roomId,
        "2024-01-15"
      );

      expect(roomTemperatures).toHaveLength(3);
      expect(roomTemperatures[0].degrees).toBe(20.5);
      expect(roomTemperatures[1].degrees).toBe(22.0);
      expect(roomTemperatures[2].degrees).toBe(21.5);
    });

    it("should calculate temperature statistics", () => {
      // Setup: Create a house with room and temperatures
      const { rooms } = DatabaseTestHelpers.createTestHouse({
        name: "Test House",
        rooms: [{ name: "Living Room" }],
      });

      const roomId = rooms[0].roomId;

      DatabaseTestHelpers.createTestTemperatures(roomId, [
        { hour: 9, degrees: 18.0, date: "2024-01-15" },
        { hour: 12, degrees: 25.0, date: "2024-01-15" },
        { hour: 15, degrees: 22.0, date: "2024-01-15" },
      ]);

      // Calculate statistics
      const stats = DatabaseQueries.getTemperatureStats(
        roomId,
        "2024-01-15",
        "2024-01-15"
      );

      expect(stats).not.toBeNull();
      expect(stats?.count).toBe(3);
      expect(stats?.min).toBe(18.0);
      expect(stats?.max).toBe(25.0);
      expect(stats?.average).toBe(21.666666666666668);
    });
  });

  describe("Database State Verification", () => {
    it("should verify database state correctly", () => {
      // Create test data
      DatabaseTestHelpers.createCompleteTestScenario();

      // Verify state
      const verification = DatabaseTestHelpers.verifyDatabaseState({
        houseCount: 1,
        roomCount: 2,
        temperatureCount: 3,
      });

      expect(verification.allMatch).toBe(true);
      expect(verification.actual.houseCount).toBe(1);
      expect(verification.actual.roomCount).toBe(2);
      expect(verification.actual.temperatureCount).toBe(3);
    });

    it("should detect incorrect database state", () => {
      // Create minimal test data
      DatabaseQueries.createHouse({
        name: "Test House",
      });

      // Verify with wrong expectations
      const verification = DatabaseTestHelpers.verifyDatabaseState({
        houseCount: 2, // Wrong expectation
        roomCount: 0,
      });

      expect(verification.allMatch).toBe(false);
      expect(
        verification.checks.find((c) => c.name === "house count")?.matches
      ).toBe(false);
      expect(
        verification.checks.find((c) => c.name === "room count")?.matches
      ).toBe(true);
    });
  });

  describe("CRUD Operations with Audit Logging", () => {
    it("should log create operations", () => {
      const house = DatabaseQueries.createHouse({
        name: "Test House",
      });

      // Check that audit log was created
      const allData = DatabaseTestHelpers.getAllData();
      expect(allData.auditLogs).toHaveLength(1);
      expect(allData.auditLogs[0]).toEqual(
        expect.objectContaining({
          entityType: "house",
          entityId: house.houseId,
          action: "create",
          userId: 1,
        })
      );
    });

    it("should log update operations", () => {
      // Create a house
      const house = DatabaseQueries.createHouse({
        name: "Original Name",
      });

      // Update the house
      DatabaseQueries.updateHouse(house.houseId, {
        name: "Updated Name",
      });

      // Check audit logs
      const allData = DatabaseTestHelpers.getAllData();
      expect(allData.auditLogs).toHaveLength(2); // Create + Update

      const updateLog = allData.auditLogs.find(
        (log) => log.action === "update"
      );
      expect(updateLog).toBeDefined();
      expect(updateLog?.entityType).toBe("house");
      expect(updateLog?.entityId).toBe(house.houseId);
    });

    it("should log delete operations", () => {
      // Create a house
      const house = DatabaseQueries.createHouse({
        name: "To Be Deleted",
      });

      // Delete the house
      DatabaseQueries.deleteHouse(house.houseId);

      // Check audit logs
      const allData = DatabaseTestHelpers.getAllData();
      expect(allData.auditLogs).toHaveLength(2); // Create + Delete

      const deleteLog = allData.auditLogs.find(
        (log) => log.action === "delete"
      );
      expect(deleteLog).toBeDefined();
      expect(deleteLog?.entityType).toBe("house");
      expect(deleteLog?.entityId).toBe(house.houseId);

      // Verify house is actually deleted
      const houses = DatabaseQueries.getAllHouses();
      expect(houses).toHaveLength(0);
    });
  });
});
