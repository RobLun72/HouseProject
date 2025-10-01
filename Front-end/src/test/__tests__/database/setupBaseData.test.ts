// src/test/__tests__/database/setupBaseData.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  setupBaseData,
  setupBaseDataWithTemperatures,
} from "../../../shared/mocks/database/seeders";
import { DatabaseTestHelpers } from "../../utils/database-helpers";

describe("setupBaseData function", () => {
  beforeEach(() => {
    DatabaseTestHelpers.clearDatabase();
  });

  it("should load houses and rooms from JSON files", () => {
    setupBaseData();

    const verification = DatabaseTestHelpers.verifyDatabaseState({
      houseCount: 3,
      roomCount: 3, // House 1: 2 rooms, House 2: 1 room, House 3: 0 rooms
    });

    expect(verification.allMatch).toBe(true);
    expect(verification.actual.houseCount).toBe(3);
    expect(verification.actual.roomCount).toBe(3);
  });

  it("should load specific house data correctly", () => {
    setupBaseData();

    const allData = DatabaseTestHelpers.getAllData();

    // Check house names match JSON data
    const houseNames = allData.houses.map((h) => h.name).sort();
    expect(houseNames).toEqual([
      "Downtown Apartment",
      "Lake House",
      "Main Family House",
    ]);

    // Check room distribution
    const house1Rooms = allData.rooms.filter((r) => r.houseId === 1);
    const house2Rooms = allData.rooms.filter((r) => r.houseId === 2);
    const house3Rooms = allData.rooms.filter((r) => r.houseId === 3);

    expect(house1Rooms).toHaveLength(2); // Main Family House has 2 rooms
    expect(house2Rooms).toHaveLength(1); // Downtown Apartment has 1 room
    expect(house3Rooms).toHaveLength(0); // Lake House has 0 rooms
  });

  it("should create default test users", () => {
    setupBaseData();

    const allData = DatabaseTestHelpers.getAllData();
    expect(allData.users).toHaveLength(2);

    const usernames = allData.users.map((u) => u.username).sort();
    expect(usernames).toEqual(["admin", "testuser"]);
  });

  it("should add temperature data when using setupBaseDataWithTemperatures", () => {
    setupBaseDataWithTemperatures();

    const verification = DatabaseTestHelpers.verifyDatabaseState({
      houseCount: 3,
      roomCount: 3,
      temperatureCount: 36, // 3 rooms × 3 days × 4 readings per day
    });

    expect(verification.allMatch).toBe(true);
  });
});
