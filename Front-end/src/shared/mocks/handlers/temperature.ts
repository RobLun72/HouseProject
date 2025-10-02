// src/shared/mocks/handlers/temperature.ts
import { HttpResponse, http } from "msw";
import type { HandlerConfig } from "./config";
import {
  getDatabaseQueries,
  checkDatabaseInitialized,
  logRequest,
  applyConfiguredDelay,
  checkAuth,
} from "./utils";

export const createTemperatureHandlers = (config: HandlerConfig) => [
  // GET /HousesWithRooms - Get houses with rooms
  http.get(
    `${config.temperatureApiBase}/HousesWithRooms`,
    async ({ request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houses = databaseQueries!.getHousesWithRooms();
        return HttpResponse.json({ houses });
      } catch (error) {
        console.error("Error in HousesWithRooms:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // GET /Temperature/room/{roomId}/dates - Get available dates for room
  http.get(
    `${config.temperatureApiBase}/Temperature/room/:roomId/dates`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      const roomId = parseInt(params.roomId as string);

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const dates = databaseQueries!.getAvailableDatesForRoom(roomId);
        return HttpResponse.json(dates);
      } catch (error) {
        console.error("Error getting available dates:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // GET /Temperature/room/{roomId}/date/{date} - Get temperatures for room and date
  http.get(
    `${config.temperatureApiBase}/Temperature/room/:roomId/date/:date`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      const roomId = parseInt(params.roomId as string);
      const date = params.date as string;

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return HttpResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        );
      }

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const temperatures = databaseQueries!.getTemperaturesByRoomAndDate(
          roomId,
          date
        );
        return HttpResponse.json(temperatures);
      } catch (error) {
        console.error("Error getting temperatures:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // PUT /Temperature/{tempId} - Update temperature
  http.put(
    `${config.temperatureApiBase}/Temperature/:tempId`,
    async ({ params, request }) => {
      logRequest(config, "PUT", "/Temperature/:tempId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      const tempId = parseInt(params.tempId as string);

      if (isNaN(tempId)) {
        return HttpResponse.json(
          { error: "Invalid temperature ID" },
          { status: 400 }
        );
      }

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const body = (await request.json()) as Record<string, unknown>;

        // Validate request body
        const validationErrors = validateTemperatureData(body);
        if (validationErrors.length > 0) {
          return HttpResponse.json(
            { error: "Validation failed", details: validationErrors },
            { status: 400 }
          );
        }

        const updatedTemperature = databaseQueries!.updateTemperature(tempId, {
          hour: body.hour as number,
          degrees: body.degrees as number,
          date: body.date as string,
        });

        if (config.environment === "development") {
          console.log("🌡️ MSW updated temperature:", updatedTemperature);
        }

        return HttpResponse.json(updatedTemperature);
      } catch (error: unknown) {
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

  // POST /Temperature - Create new temperature
  http.post(`${config.temperatureApiBase}/Temperature`, async ({ request }) => {
    logRequest(config, "POST", "/Temperature");
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

      const body = (await request.json()) as Record<string, unknown>;

      // Validate request body
      const validationErrors = validateTemperatureData(body);
      if (validationErrors.length > 0) {
        return HttpResponse.json(
          { error: "Validation failed", details: validationErrors },
          { status: 400 }
        );
      }

      // Check if room exists
      const room = databaseQueries!.getRoomById(body.roomId as number);
      if (!room) {
        return HttpResponse.json({ error: "Room not found" }, { status: 404 });
      }

      const newTemperature = databaseQueries!.createTemperature({
        roomId: body.roomId as number,
        hour: body.hour as number,
        degrees: body.degrees as number,
        date: body.date as string,
      });

      if (config.environment === "development") {
        console.log("🌡️ MSW created new temperature:", newTemperature);
      }

      return HttpResponse.json(newTemperature, { status: 201 });
    } catch (error) {
      console.error("Temperature creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // DELETE /Temperature/{tempId} - Delete temperature
  http.delete(
    `${config.temperatureApiBase}/Temperature/:tempId`,
    async ({ params, request }) => {
      logRequest(config, "DELETE", "/Temperature/:tempId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      const tempId = parseInt(params.tempId as string);

      if (isNaN(tempId)) {
        return HttpResponse.json(
          { error: "Invalid temperature ID" },
          { status: 400 }
        );
      }

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        databaseQueries!.deleteTemperature(tempId);

        if (config.environment === "development") {
          console.log("🌡️ MSW deleted temperature:", tempId);
        }

        return HttpResponse.json({ success: true }, { status: 204 });
      } catch (error: unknown) {
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

// Validation helper function
function validateTemperatureData(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (typeof data.roomId !== "number" || data.roomId <= 0) {
    errors.push("roomId must be a positive number");
  }

  if (typeof data.hour !== "number" || data.hour < 0 || data.hour > 23) {
    errors.push("hour must be a number between 0 and 23");
  }

  if (typeof data.degrees !== "number") {
    errors.push("degrees must be a number");
  }

  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(data.date)) {
    errors.push("date must be in YYYY-MM-DD format");
  }

  return errors;
}
