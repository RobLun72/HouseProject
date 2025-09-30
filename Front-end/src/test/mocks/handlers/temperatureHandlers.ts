import { HttpResponse, http } from "msw";
import { DatabaseQueries } from "../database/queries";

const API_BASE = "http://localhost:5001/api";

export const temperatureHandlers = [
  // GET /HousesWithRooms - Now powered by database
  http.get(`${API_BASE}/HousesWithRooms`, ({ request }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const houses = DatabaseQueries.getHousesWithRooms();
      return HttpResponse.json({ houses });
    } catch (error) {
      console.error("Error in HousesWithRooms:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Temperature/room/{roomId}/dates - Database-powered
  http.get(
    `${API_BASE}/Temperature/room/:roomId/dates`,
    ({ params, request }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);

      if (!apiKey || apiKey !== "test-api-key") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      try {
        const dates = DatabaseQueries.getAvailableDatesForRoom(roomId);
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

  // GET /Temperature/room/{roomId}/date/{date} - Database-powered
  http.get(
    `${API_BASE}/Temperature/room/:roomId/date/:date`,
    ({ params, request }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);
      const date = params.date as string;

      if (!apiKey || apiKey !== "test-api-key") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

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
        const temperatures = DatabaseQueries.getTemperaturesByRoomAndDate(
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

  // PUT /Temperature/{tempId} - Database-powered with validation
  http.put(`${API_BASE}/Temperature/:tempId`, async ({ params, request }) => {
    const apiKey = request.headers.get("X-Api-Key");
    const tempId = parseInt(params.tempId as string);

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(tempId)) {
      return HttpResponse.json(
        { error: "Invalid temperature ID" },
        { status: 400 }
      );
    }

    try {
      const body = (await request.json()) as Record<string, unknown>;

      // Validate request body
      const validationErrors = validateTemperatureData(body);
      if (validationErrors.length > 0) {
        return HttpResponse.json(
          { error: "Validation failed", details: validationErrors },
          { status: 400 }
        );
      }

      const updatedTemperature = DatabaseQueries.updateTemperature(tempId, {
        hour: body.hour as number,
        degrees: body.degrees as number,
        date: body.date as string,
      });

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
  }),

  // POST /Temperature - Database-powered creation
  http.post(`${API_BASE}/Temperature`, async ({ request }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
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
      const room = DatabaseQueries.getRoomById(body.roomId as number);
      if (!room) {
        return HttpResponse.json({ error: "Room not found" }, { status: 404 });
      }

      const newTemperature = DatabaseQueries.createTemperature({
        roomId: body.roomId as number,
        hour: body.hour as number,
        degrees: body.degrees as number,
        date: body.date as string,
      });

      return HttpResponse.json(newTemperature, { status: 201 });
    } catch (error) {
      console.error("Temperature creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // DELETE /Temperature/{tempId} - Database-powered deletion
  http.delete(`${API_BASE}/Temperature/:tempId`, ({ params, request }) => {
    const apiKey = request.headers.get("X-Api-Key");
    const tempId = parseInt(params.tempId as string);

    if (!apiKey || apiKey !== "test-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(tempId)) {
      return HttpResponse.json(
        { error: "Invalid temperature ID" },
        { status: 400 }
      );
    }

    try {
      DatabaseQueries.deleteTemperature(tempId);
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
  }),

  // GET /Temperature/room/{roomId}/stats - New endpoint for statistics
  http.get(
    `${API_BASE}/Temperature/room/:roomId/stats`,
    ({ params, request }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);
      const url = new URL(request.url);
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");

      if (!apiKey || apiKey !== "test-api-key") {
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      try {
        const stats = DatabaseQueries.getTemperatureStats(
          roomId,
          startDate || "2020-01-01",
          endDate || "2030-12-31"
        );

        if (!stats) {
          return HttpResponse.json({ error: "No data found" }, { status: 404 });
        }

        return HttpResponse.json(stats);
      } catch (error) {
        console.error("Temperature statistics error:", error);
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
