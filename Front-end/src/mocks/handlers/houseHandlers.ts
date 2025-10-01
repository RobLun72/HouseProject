// src/mocks/handlers/houseHandlers.ts
import { http, HttpResponse } from "msw";
import {
  applyDevDelay,
  checkDatabaseInitialized,
  logMswRequest,
} from "../utils";
import { HOUSE_API_BASE, getDatabaseQueries } from "./shared";

export const houseHandlers = [
  // GET /House - Get all houses
  http.get(`${HOUSE_API_BASE}/House`, async () => {
    logMswRequest("GET", "/House");
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const houses = DatabaseQueries!.getAllHouses();
      console.log("📦 MSW returning houses:", houses.length, "houses");
      return HttpResponse.json(houses);
    } catch (error) {
      console.error("Houses fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /House/:houseId - Get house by ID
  http.get(`${HOUSE_API_BASE}/House/:houseId`, async ({ params }) => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const houseId = parseInt(params.houseId as string, 10);

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const house = DatabaseQueries!.getHouseById(houseId);

      if (!house) {
        return HttpResponse.json({ error: "House not found" }, { status: 404 });
      }

      return HttpResponse.json(house);
    } catch (error) {
      console.error("House fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // POST /House - Create new house
  http.post(`${HOUSE_API_BASE}/House`, async ({ request }) => {
    logMswRequest("POST", "/House");
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields
      if (!body.name || typeof body.name !== "string") {
        return HttpResponse.json(
          { error: "House name is required" },
          { status: 400 }
        );
      }

      const newHouse = DatabaseQueries!.createHouse({
        name: body.name as string,
        address: body.address as string | null,
        area: body.area ? Number(body.area) : 0,
      });

      console.log("🏠 MSW created new house:", newHouse);
      return HttpResponse.json(newHouse, { status: 201 });
    } catch (error) {
      console.error("House creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // PUT /House/:houseId - Update house
  http.put(`${HOUSE_API_BASE}/House/:houseId`, async ({ params, request }) => {
    logMswRequest("PUT", "/House/:houseId");
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const houseId = parseInt(params.houseId as string, 10);
      const body = (await request.json()) as Record<string, unknown>;

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const updatedHouse = DatabaseQueries!.updateHouse(houseId, {
        name: body.name as string,
        address: body.address as string | null,
        area: body.area ? Number(body.area) : undefined,
      });

      console.log("🏠 MSW updated house:", updatedHouse);
      return HttpResponse.json(updatedHouse);
    } catch (error) {
      console.error("House update error:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return HttpResponse.json({ error: "House not found" }, { status: 404 });
      }
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // DELETE /House/:houseId - Delete house
  http.delete(`${HOUSE_API_BASE}/House/:houseId`, async ({ params }) => {
    logMswRequest("DELETE", "/House/:houseId");
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const houseId = parseInt(params.houseId as string, 10);

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const result = DatabaseQueries!.deleteHouse(houseId);
      console.log("🏠 MSW deleted house:", houseId, "result:", result);
      return HttpResponse.json(result);
    } catch (error) {
      console.error("House deletion error:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        return HttpResponse.json({ error: "House not found" }, { status: 404 });
      }
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),
];
