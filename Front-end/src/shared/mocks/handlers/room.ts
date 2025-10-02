// src/shared/mocks/handlers/room.ts
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

export const createRoomHandlers = (config: HandlerConfig) => [
  // GET /Room/house/:houseId - Get rooms for a house
  http.get(
    `${config.houseApiBase}/Room/house/:houseId`,
    async ({ params, request }) => {
      logRequest(config, "GET", "/Room/house/:houseId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const houseId = params.houseId as string;

        if (!houseId || isNaN(Number(houseId))) {
          return HttpResponse.json(
            { error: "Invalid house ID" },
            { status: 400 }
          );
        }

        const rooms = databaseQueries!.getRoomsByHouseId(Number(houseId));
        logResponse(
          config,
          "returning rooms for house",
          houseId,
          ":",
          rooms.length,
          "rooms"
        );
        return HttpResponse.json(rooms);
      } catch (error) {
        console.error("Room fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // GET /Room/:roomId - Get a specific room
  http.get(
    `${config.houseApiBase}/Room/:roomId`,
    async ({ params, request }) => {
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const roomId = params.roomId as string;

        if (!roomId || isNaN(Number(roomId))) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const room = databaseQueries!.getRoomById(Number(roomId));

        if (!room) {
          return HttpResponse.json(
            { error: "Room not found" },
            { status: 404 }
          );
        }

        return HttpResponse.json(room);
      } catch (error) {
        console.error("Room fetch error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // POST /Room - Create a new room
  http.post(`${config.houseApiBase}/Room`, async ({ request }) => {
    logRequest(config, "POST", "/Room");
    await applyConfiguredDelay(config);

    const authCheck = checkAuth(request, config);
    if (authCheck) return authCheck;

    try {
      const databaseQueries = getDatabaseQueries(config);
      const dbCheck = checkDatabaseInitialized(config, databaseQueries);
      if (dbCheck) return dbCheck;

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

      // Validate area if provided
      if (
        body.area !== undefined &&
        (isNaN(Number(body.area)) || Number(body.area) <= 0)
      ) {
        return HttpResponse.json(
          { error: "Area must be a positive number" },
          { status: 400 }
        );
      }

      const newRoom = databaseQueries!.createRoom({
        name: body.name as string,
        houseId: Number(body.houseId),
        type: (body.type as string) || "General",
        area: body.area ? Number(body.area) : 0,
        placement: (body.placement as string) || "Ground Floor",
      });

      if (config.environment === "development") {
        console.log("🏠 MSW created new room:", newRoom);
      }

      return HttpResponse.json(newRoom, { status: 201 });
    } catch (error) {
      console.error("Room creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // PUT /Room/:roomId - Update a room
  http.put(
    `${config.houseApiBase}/Room/:roomId`,
    async ({ params, request }) => {
      logRequest(config, "PUT", "/Room/:roomId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const roomId = params.roomId as string;
        const body = (await request.json()) as Record<string, unknown>;

        if (!roomId || isNaN(Number(roomId))) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        // Validate fields if provided
        if (
          body.name !== undefined &&
          (!body.name || typeof body.name !== "string")
        ) {
          return HttpResponse.json(
            { error: "Room name is required" },
            { status: 400 }
          );
        }

        if (
          body.area !== undefined &&
          (isNaN(Number(body.area)) || Number(body.area) <= 0)
        ) {
          return HttpResponse.json(
            { error: "Area must be a positive number" },
            { status: 400 }
          );
        }

        const updates: {
          name?: string;
          type?: string;
          area?: number;
          placement?: string;
        } = {};
        if (body.name) updates.name = body.name as string;
        if (body.type) updates.type = body.type as string;
        if (body.area !== undefined) updates.area = Number(body.area);
        if (body.placement) updates.placement = body.placement as string;

        const updatedRoom = databaseQueries!.updateRoom(
          Number(roomId),
          updates
        );

        if (config.environment === "development") {
          console.log("🏠 MSW updated room:", updatedRoom);
        }

        return HttpResponse.json(updatedRoom);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return HttpResponse.json(
            { error: "Room not found" },
            { status: 404 }
          );
        }

        console.error("Room update error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),

  // DELETE /Room/:roomId - Delete a room
  http.delete(
    `${config.houseApiBase}/Room/:roomId`,
    async ({ params, request }) => {
      logRequest(config, "DELETE", "/Room/:roomId");
      await applyConfiguredDelay(config);

      const authCheck = checkAuth(request, config);
      if (authCheck) return authCheck;

      try {
        const databaseQueries = getDatabaseQueries(config);
        const dbCheck = checkDatabaseInitialized(config, databaseQueries);
        if (dbCheck) return dbCheck;

        const roomId = params.roomId as string;

        if (!roomId || isNaN(Number(roomId))) {
          return HttpResponse.json(
            { error: "Invalid room ID" },
            { status: 400 }
          );
        }

        const result = databaseQueries!.deleteRoom(Number(roomId));

        if (!result.success) {
          return HttpResponse.json(
            { error: "Room not found" },
            { status: 404 }
          );
        }

        if (config.environment === "development") {
          console.log("🏠 MSW deleted room:", roomId, "result:", result);
        }

        return HttpResponse.json({ message: "Room deleted successfully" });
      } catch (error) {
        console.error("Room delete error:", error);
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),
];
