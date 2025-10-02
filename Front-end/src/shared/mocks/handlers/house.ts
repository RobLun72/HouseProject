// src/shared/mocks/handlers/house.ts
import { http, HttpResponse } from "msw";
import type { HandlerConfig } from "./config";
import {
  getDatabaseQueries,
  checkDatabaseInitialized,
  logRequest,
  logResponse,
  applyConfiguredDelay,
  checkAuth,
} from "./utils";

export const createHouseHandlers = (config: HandlerConfig) => [
  // GET /House - Get all houses
  http.get(`${config.houseApiBase}/House`, async ({ request }) => {
    logRequest(config, "GET", "/House");
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const houses = databaseQueries!.getAllHouses();
      logResponse(config, "returning houses:", houses.length, "houses");
      return HttpResponse.json(houses);
    } catch (error) {
      console.error("Houses fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /House/:houseId - Get house by ID (development pattern)
  http.get(
    `${config.houseApiBase}/House/:houseId`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = parseInt(params.houseId as string, 10);

        if (isNaN(houseId)) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        const house = databaseQueries!.getHouseById(houseId);

        if (!house) {
          return HttpResponse.json(
            { error: "House not found" },
            { status: 404 }
          );
        }

        return HttpResponse.json(house);
      } catch (error) {
        console.error("House fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // GET /House/:id - Get house by ID (test pattern)
  http.get(`${config.houseApiBase}/House/:id`, async ({ params, request }) => {
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const houseId = params.id as string;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const house = databaseQueries!.getHouseById(Number(houseId));

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

  // GET /houses/with-rooms - Get houses with rooms (test pattern)
  http.get(`${config.houseApiBase}/houses/with-rooms`, async ({ request }) => {
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const housesWithRooms = databaseQueries!.getHousesWithRooms();
      return HttpResponse.json(housesWithRooms);
    } catch (error) {
      console.error("Houses with rooms fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // POST /House - Create new house
  http.post(`${config.houseApiBase}/House`, async ({ request }) => {
    logRequest(config, "POST", "/House");
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields - handle both error message patterns
      if (!body.name || typeof body.name !== "string") {
        const errorMessage =
          config.environment === "development"
            ? "House name is required"
            : "Name is required";
        return HttpResponse.json({ error: errorMessage }, { status: 400 });
      }

      const newHouse = databaseQueries!.createHouse({
        name: body.name as string,
        address: body.address as string | null,
        area: body.area ? Number(body.area) : 0,
      });

      if (config.environment === "development") {
        console.log("🏠 MSW created new house:", newHouse);
      }

      return HttpResponse.json(newHouse, { status: 201 });
    } catch (error) {
      console.error("House creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // PUT /House/:houseId - Update house (development pattern)
  http.put(
    `${config.houseApiBase}/House/:houseId`,
    async ({ params, request }) => {
      logRequest(config, "PUT", "/House/:houseId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = parseInt(params.houseId as string, 10);
        const body = (await request.json()) as Record<string, unknown>;

        if (isNaN(houseId)) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        // Validate required fields
        const errorMessage =
          config.environment === "development"
            ? "House name is required"
            : "Name is required";

        if (!body.name || typeof body.name !== "string") {
          return HttpResponse.json({ error: errorMessage }, { status: 400 });
        }

        const updatedHouse = databaseQueries!.updateHouse(houseId, {
          name: body.name as string,
          address: body.address as string | null,
          area: body.area ? Number(body.area) : undefined,
        });

        if (config.environment === "development") {
          console.log("🏠 MSW updated house:", updatedHouse);
        }

        return HttpResponse.json(updatedHouse);
      } catch (error) {
        console.error("House update error:", error);
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "House not found" },
            { status: 404 }
          );
        }
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // PUT /House/:id - Update house (test pattern)
  http.put(`${config.houseApiBase}/House/:id`, async ({ params, request }) => {
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const houseId = params.id as string;
      const body = (await request.json()) as Record<string, unknown>;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!body.name || typeof body.name !== "string") {
        return HttpResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const updatedHouse = databaseQueries!.updateHouse(Number(houseId), {
        name: body.name as string,
        address: (body.address as string) || null,
        area: (body.area as number) || 0,
      });

      return HttpResponse.json(updatedHouse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("not found")) {
        return HttpResponse.json({ error: "House not found" }, { status: 404 });
      }

      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // DELETE /House/:houseId - Delete house (development pattern)
  http.delete(
    `${config.houseApiBase}/House/:houseId`,
    async ({ params, request }) => {
      logRequest(config, "DELETE", "/House/:houseId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = parseInt(params.houseId as string, 10);

        if (isNaN(houseId)) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        const result = databaseQueries!.deleteHouse(houseId);

        if (config.environment === "development") {
          console.log("🏠 MSW deleted house:", houseId, "result:", result);
        }

        return HttpResponse.json(result);
      } catch (error) {
        console.error("House deletion error:", error);
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "House not found" },
            { status: 404 }
          );
        }
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // DELETE /House/:id - Delete house (test pattern)
  http.delete(
    `${config.houseApiBase}/House/:id`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = params.id as string;

        if (!houseId || isNaN(Number(houseId))) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        databaseQueries!.deleteHouse(Number(houseId));
        return HttpResponse.json({ success: true }, { status: 204 });
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "House not found" },
            { status: 404 }
          );
        }

        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // GET /houses/:id/rooms - Get rooms for a house (test pattern)
  http.get(
    `${config.houseApiBase}/houses/:id/rooms`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = params.id as string;

        if (!houseId || isNaN(Number(houseId))) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        const rooms = databaseQueries!.getRoomsByHouseId(Number(houseId));
        return HttpResponse.json(rooms);
      } catch (error) {
        console.error("House rooms fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // POST /houses/:id/rooms - Create room for a house (test pattern)
  http.post(
    `${config.houseApiBase}/houses/:id/rooms`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = params.id as string;
        const body = (await request.json()) as Record<string, unknown>;

        if (!houseId || isNaN(Number(houseId))) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        // Validate required fields
        if (!body.name || typeof body.name !== "string") {
          return HttpResponse.json(
            { error: "Room name is required" },
            { status: 400 }
          );
        }

        const newRoom = databaseQueries!.createRoom({
          name: body.name as string,
          houseId: Number(houseId),
          type: (body.type as string) || "General",
          area: body.area ? Number(body.area) : 0,
          placement: (body.placement as string) || "Ground Floor",
        });

        return HttpResponse.json(newRoom, { status: 201 });
      } catch (error) {
        console.error("Room creation error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),
];
