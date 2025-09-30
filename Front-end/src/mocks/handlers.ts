// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import { applyDevDelay } from "./utils";

// For development, we'll use the MSW database with proper seeding
// Import the database operations that work in browser context
// Use the same API URLs that the application is configured to use
const HOUSE_API_BASE =
  import.meta.env.VITE_HOUSE_API_URL || "https://localhost:7001";
const TEMPERATURE_API_BASE =
  import.meta.env.VITE_TEMPERATURE_API_URL || "https://localhost:7002";

// Use the same API key that the application is configured to use
const EXPECTED_API_KEY =
  import.meta.env.VITE_TEMPERATURE_API_KEY || "test-api-key";

// Import the type for better typing
type DatabaseQueriesType =
  typeof import("../test/mocks/database/queries").DatabaseQueries;

// These will be populated by the database once it's initialized
let DatabaseQueries: DatabaseQueriesType | null = null;

// Initialize database queries - will be set up when MSW starts
export const initializeDatabaseQueries = (queries: DatabaseQueriesType) => {
  DatabaseQueries = queries;
};

export const developmentHandlers = [
  // House handlers
  http.get(`${HOUSE_API_BASE}/House`, async () => {
    console.log("🎯 MSW intercepted GET /House request");
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houses = DatabaseQueries.getAllHouses();
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

  http.get(`${HOUSE_API_BASE}/House/:houseId`, async ({ params }) => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houseId = parseInt(params.houseId as string, 10);

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const house = DatabaseQueries.getHouseById(houseId);

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

  // House CRUD operations
  http.post(`${HOUSE_API_BASE}/House`, async ({ request }) => {
    console.log("🎯 MSW intercepted POST /House request");
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields
      if (!body.name || typeof body.name !== "string") {
        return HttpResponse.json(
          { error: "House name is required" },
          { status: 400 }
        );
      }

      const newHouse = DatabaseQueries.createHouse({
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

  http.put(`${HOUSE_API_BASE}/House/:houseId`, async ({ params, request }) => {
    console.log("🎯 MSW intercepted PUT /House/:houseId request");
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houseId = parseInt(params.houseId as string, 10);
      const body = (await request.json()) as Record<string, unknown>;

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const updatedHouse = DatabaseQueries.updateHouse(houseId, {
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

  http.delete(`${HOUSE_API_BASE}/House/:houseId`, async ({ params }) => {
    console.log("🎯 MSW intercepted DELETE /House/:houseId request");
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houseId = parseInt(params.houseId as string, 10);

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const result = DatabaseQueries.deleteHouse(houseId);
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

  // Room handlers
  http.get(`${HOUSE_API_BASE}/Room/house/:houseId`, async ({ params }) => {
    console.log(
      "🎯 MSW intercepted GET /Room/house/:houseId request for house:",
      params.houseId
    );
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houseId = parseInt(params.houseId as string, 10);

      if (isNaN(houseId)) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const rooms = DatabaseQueries.getRoomsByHouseId(houseId);
      return HttpResponse.json(rooms);
    } catch (error) {
      console.error("Room fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  http.get(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params }) => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const roomId = parseInt(params.roomId as string, 10);

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const room = DatabaseQueries.getRoomById(roomId);

      if (!room) {
        return HttpResponse.json({ error: "Room not found" }, { status: 404 });
      }

      return HttpResponse.json(room);
    } catch (error) {
      console.error("Room fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  http.post(`${HOUSE_API_BASE}/Room`, async ({ request }) => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields
      if (!body.name || typeof body.name !== "string") {
        return HttpResponse.json(
          { error: "Room name is required" },
          { status: 400 }
        );
      }

      if (!body.houseId || isNaN(Number(body.houseId))) {
        return HttpResponse.json(
          { error: "Valid house ID is required" },
          { status: 400 }
        );
      }

      const newRoom = DatabaseQueries.createRoom({
        name: body.name as string,
        houseId: Number(body.houseId),
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
  }),

  http.put(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params, request }) => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const roomId = parseInt(params.roomId as string, 10);
      const body = (await request.json()) as Record<string, unknown>;

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const updatedRoom = DatabaseQueries.updateRoom(roomId, {
        name: body.name as string,
        type: body.type as string,
        area: body.area ? Number(body.area) : undefined,
        placement: body.placement as string,
      });

      return HttpResponse.json(updatedRoom);
    } catch (error) {
      console.error("Room update error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  http.delete(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params }) => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const roomId = parseInt(params.roomId as string, 10);

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const result = DatabaseQueries.deleteRoom(roomId);
      return HttpResponse.json(result);
    } catch (error) {
      console.error("Room deletion error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // Temperature handlers
  http.get(`${TEMPERATURE_API_BASE}/HousesWithRooms`, async () => {
    await applyDevDelay();
    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const houses = DatabaseQueries.getHousesWithRooms();
      return HttpResponse.json({ houses });
    } catch (error) {
      console.error("HousesWithRooms fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  http.get(
    `${TEMPERATURE_API_BASE}/Temperature/room/:roomId/dates`,
    async ({ params, request }) => {
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        if (!DatabaseQueries) {
          return HttpResponse.json(
            { error: "Database not initialized" },
            { status: 500 }
          );
        }
        const roomId = parseInt(params.roomId as string, 10);

        if (isNaN(roomId)) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const dates = DatabaseQueries.getAvailableDatesForRoom(roomId);
        return HttpResponse.json({ dates });
      } catch (error) {
        console.error("Temperature dates fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  http.get(
    `${TEMPERATURE_API_BASE}/Temperature/room/:roomId/date/:date`,
    async ({ params, request }) => {
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        if (!DatabaseQueries) {
          return HttpResponse.json(
            { error: "Database not initialized" },
            { status: 500 }
          );
        }
        const roomId = parseInt(params.roomId as string, 10);
        const date = params.date as string;

        if (isNaN(roomId)) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const temperatures = DatabaseQueries.getTemperaturesByRoomAndDate(
          roomId,
          date
        );
        return HttpResponse.json({ temperatures });
      } catch (error) {
        console.error("Temperature data fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // Temperature CRUD operations
  http.post(`${TEMPERATURE_API_BASE}/Temperature`, async ({ request }) => {
    console.log("🎯 MSW intercepted POST /Temperature request");
    await applyDevDelay();

    const apiKey = request.headers.get("X-Api-Key");
    if (!apiKey || apiKey !== EXPECTED_API_KEY) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      if (!DatabaseQueries) {
        return HttpResponse.json(
          { error: "Database not initialized" },
          { status: 500 }
        );
      }
      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields
      if (!body.roomId || isNaN(Number(body.roomId))) {
        return HttpResponse.json(
          { error: "Valid room ID is required" },
          { status: 400 }
        );
      }

      if (body.hour === undefined || isNaN(Number(body.hour))) {
        return HttpResponse.json(
          { error: "Valid hour is required" },
          { status: 400 }
        );
      }

      if (body.degrees === undefined || isNaN(Number(body.degrees))) {
        return HttpResponse.json(
          { error: "Valid degrees is required" },
          { status: 400 }
        );
      }

      const date = body.date
        ? new Date(body.date as string).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const newTemperature = DatabaseQueries.createTemperature({
        roomId: Number(body.roomId),
        hour: Number(body.hour),
        degrees: Number(body.degrees),
        date: date,
      });

      console.log("🌡️ MSW created new temperature:", newTemperature);
      return HttpResponse.json(newTemperature, { status: 201 });
    } catch (error) {
      console.error("Temperature creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  http.put(
    `${TEMPERATURE_API_BASE}/Temperature/:tempId`,
    async ({ params, request }) => {
      console.log("🎯 MSW intercepted PUT /Temperature/:tempId request");
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        if (!DatabaseQueries) {
          return HttpResponse.json(
            { error: "Database not initialized" },
            { status: 500 }
          );
        }
        const tempId = parseInt(params.tempId as string, 10);
        const body = (await request.json()) as Record<string, unknown>;

        if (isNaN(tempId)) {
          return HttpResponse.json(
            { error: "Invalid temperature ID" },
            { status: 400 }
          );
        }

        const updatedTemperature = DatabaseQueries.updateTemperature(tempId, {
          hour: body.hour ? Number(body.hour) : undefined,
          degrees: body.degrees ? Number(body.degrees) : undefined,
          date: body.date
            ? new Date(body.date as string).toISOString().split("T")[0]
            : undefined,
        });

        console.log("🌡️ MSW updated temperature:", updatedTemperature);
        return HttpResponse.json(updatedTemperature);
      } catch (error) {
        console.error("Temperature update error:", error);
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "Temperature not found" },
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

  http.delete(
    `${TEMPERATURE_API_BASE}/Temperature/:tempId`,
    async ({ params, request }) => {
      console.log("🎯 MSW intercepted DELETE /Temperature/:tempId request");
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        if (!DatabaseQueries) {
          return HttpResponse.json(
            { error: "Database not initialized" },
            { status: 500 }
          );
        }
        const tempId = parseInt(params.tempId as string, 10);

        if (isNaN(tempId)) {
          return HttpResponse.json(
            { error: "Invalid temperature ID" },
            { status: 400 }
          );
        }

        const result = DatabaseQueries.deleteTemperature(tempId);
        console.log("🌡️ MSW deleted temperature:", tempId, "result:", result);
        return HttpResponse.json(result);
      } catch (error) {
        console.error("Temperature deletion error:", error);
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "Temperature not found" },
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
];
