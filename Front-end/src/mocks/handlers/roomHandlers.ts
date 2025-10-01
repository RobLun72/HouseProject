// src/mocks/handlers/roomHandlers.ts
import { http, HttpResponse } from "msw";
import {
  applyDevDelay,
  checkDatabaseInitialized,
  logMswRequest,
} from "../utils";
import { HOUSE_API_BASE, getDatabaseQueries } from "./shared";

export const roomHandlers = [
  // GET /Room/house/:houseId - Get rooms by house ID
  http.get(`${HOUSE_API_BASE}/Room/house/:houseId`, async ({ params }) => {
    logMswRequest("GET", "/Room/house/:houseId");
    console.log("for house:", params.houseId);
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

      const rooms = DatabaseQueries!.getRoomsByHouseId(houseId);
      return HttpResponse.json(rooms);
    } catch (error) {
      console.error("Room fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Room/:roomId - Get room by ID
  http.get(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params }) => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const roomId = parseInt(params.roomId as string, 10);

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const room = DatabaseQueries!.getRoomById(roomId);

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

  // POST /Room - Create new room
  http.post(`${HOUSE_API_BASE}/Room`, async ({ request }) => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
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

      const newRoom = DatabaseQueries!.createRoom({
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

  // PUT /Room/:roomId - Update room
  http.put(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params, request }) => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const roomId = parseInt(params.roomId as string, 10);
      const body = (await request.json()) as Record<string, unknown>;

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const updatedRoom = DatabaseQueries!.updateRoom(roomId, {
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

  // DELETE /Room/:roomId - Delete room
  http.delete(`${HOUSE_API_BASE}/Room/:roomId`, async ({ params }) => {
    await applyDevDelay();
    try {
      const DatabaseQueries = getDatabaseQueries();
      const dbCheck = checkDatabaseInitialized(DatabaseQueries);
      if (dbCheck) return dbCheck;

      const roomId = parseInt(params.roomId as string, 10);

      if (isNaN(roomId)) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const result = DatabaseQueries!.deleteRoom(roomId);
      return HttpResponse.json(result);
    } catch (error) {
      console.error("Room deletion error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),
];
