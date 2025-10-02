// src/test/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseTestHelpers } from "../utils/database-helpers";

describe("Authentication Tests", () => {
  beforeEach(() => {
    DatabaseTestHelpers.clearDatabase();
  });

  describe("Temperature API Authentication", () => {
    it("should return 401 for requests without API key", async () => {
      const response = await fetch("https://localhost:7002/HousesWithRooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // No X-Api-Key header
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 for requests with invalid API key", async () => {
      const response = await fetch("https://localhost:7002/HousesWithRooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "invalid-key",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 200 for requests with valid API key", async () => {
      const response = await fetch("https://localhost:7002/HousesWithRooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe("House API Authentication", () => {
    it("should return 401 for POST requests without API key", async () => {
      const response = await fetch("https://localhost:7001/House", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No X-Api-Key header
        },
        body: JSON.stringify({
          name: "Test House",
          address: "123 Test St",
          area: 100,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 200 for POST requests with valid API key", async () => {
      const response = await fetch("https://localhost:7001/House", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
        body: JSON.stringify({
          name: "Test House",
          address: "123 Test St",
          area: 100,
        }),
      });

      expect(response.status).toBe(201);
    });

    it("should return 401 for GET requests without API key", async () => {
      const response = await fetch("https://localhost:7001/House", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // No X-Api-Key header
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 200 for GET requests with valid API key", async () => {
      const response = await fetch("https://localhost:7001/House", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe("Room API Authentication", () => {
    it("should return 401 for POST requests without API key", async () => {
      const response = await fetch("https://localhost:7001/Room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No X-Api-Key header
        },
        body: JSON.stringify({
          name: "Test Room",
          houseId: 1,
          type: "Living",
          area: 50,
          placement: "Ground Floor",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 201 for POST requests with valid API key", async () => {
      // First create a house to avoid foreign key constraint
      await fetch("https://localhost:7001/House", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
        body: JSON.stringify({
          name: "Test House",
          address: "123 Test St",
          area: 100,
        }),
      });

      const response = await fetch("https://localhost:7001/Room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
        body: JSON.stringify({
          name: "Test Room",
          houseId: 1,
          type: "Living",
          area: 50,
          placement: "Ground Floor",
        }),
      });

      expect(response.status).toBe(201);
    });

    it("should return 401 for GET requests without API key", async () => {
      const response = await fetch("https://localhost:7001/Room/house/1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // No X-Api-Key header
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 200 for GET requests with valid API key", async () => {
      const response = await fetch("https://localhost:7001/Room/house/1", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "dev-key-123456789",
        },
      });

      expect(response.status).toBe(200);
    });
  });
});
