// src/mocks/handlers/temperatureHandlers.ts
import { http, HttpResponse } from "msw";
import {
  applyDevDelay,
  checkDatabaseInitialized,
  logMswRequest,
} from "../utils";
import {
  TEMPERATURE_API_BASE,
  EXPECTED_API_KEY,
  getDatabaseQueries,
} from "./shared";

export const temperatureHandlers = [
  // GET /HousesWithRooms - Get houses with their rooms
  http.get(`${TEMPERATURE_API_BASE}/HousesWithRooms`, async () => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const houses = DatabaseQueries!.getHousesWithRooms();
      return HttpResponse.json({ houses });
    } catch (error) {
      console.error("HousesWithRooms fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Temperature/room/:roomId/dates - Get available dates for room
  http.get(
    `${TEMPERATURE_API_BASE}/Temperature/room/:roomId/dates`,
    async ({ params, request }) => {
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const DatabaseQueries = getDatabaseQueries();
        const dbCheck = checkDatabaseInitialized(DatabaseQueries);
        if (dbCheck) return dbCheck;

        const roomId = parseInt(params.roomId as string, 10);

        if (isNaN(roomId)) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const dates = DatabaseQueries!.getAvailableDatesForRoom(roomId);
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

  // GET /Temperature/room/:roomId/date/:date - Get temperatures for room and date
  http.get(
    `${TEMPERATURE_API_BASE}/Temperature/room/:roomId/date/:date`,
    async ({ params, request }) => {
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const DatabaseQueries = getDatabaseQueries();
        const dbCheck = checkDatabaseInitialized(DatabaseQueries);
        if (dbCheck) return dbCheck;

        const roomId = parseInt(params.roomId as string, 10);
        const date = params.date as string;

        if (isNaN(roomId)) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const temperatures = DatabaseQueries!.getTemperaturesByRoomAndDate(
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

  // POST /Temperature - Create new temperature reading
  http.post(`${TEMPERATURE_API_BASE}/Temperature`, async ({ request }) => {
    logMswRequest("POST", "/Temperature");
    await applyDevDelay();

    const apiKey = request.headers.get("X-Api-Key");
    if (!apiKey || apiKey !== EXPECTED_API_KEY) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

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

      const newTemperature = DatabaseQueries!.createTemperature({
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

  // PUT /Temperature/:tempId - Update temperature reading
  http.put(
    `${TEMPERATURE_API_BASE}/Temperature/:tempId`,
    async ({ params, request }) => {
      logMswRequest("PUT", "/Temperature/:tempId");
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const DatabaseQueries = getDatabaseQueries();
        const dbCheck = checkDatabaseInitialized(DatabaseQueries);
        if (dbCheck) return dbCheck;

        const tempId = parseInt(params.tempId as string, 10);
        const body = (await request.json()) as Record<string, unknown>;

        if (isNaN(tempId)) {
          return HttpResponse.json(
            { error: "Invalid temperature ID" },
            { status: 400 }
          );
        }

        const updatedTemperature = DatabaseQueries!.updateTemperature(tempId, {
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

  // DELETE /Temperature/:tempId - Delete temperature reading
  http.delete(
    `${TEMPERATURE_API_BASE}/Temperature/:tempId`,
    async ({ params, request }) => {
      logMswRequest("DELETE", "/Temperature/:tempId");
      await applyDevDelay();

      const apiKey = request.headers.get("X-Api-Key");
      if (!apiKey || apiKey !== EXPECTED_API_KEY) {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      try {
        const DatabaseQueries = getDatabaseQueries();
        const dbCheck = checkDatabaseInitialized(DatabaseQueries);
        if (dbCheck) return dbCheck;

        const tempId = parseInt(params.tempId as string, 10);

        if (isNaN(tempId)) {
          return HttpResponse.json(
            { error: "Invalid temperature ID" },
            { status: 400 }
          );
        }

        const result = DatabaseQueries!.deleteTemperature(tempId);
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
