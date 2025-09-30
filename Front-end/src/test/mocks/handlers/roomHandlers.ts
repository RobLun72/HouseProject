import { http, HttpResponse } from "msw";
import { DatabaseQueries } from "../database/queries";

const API_BASE = "http://localhost:5001/api";

export const roomHandlers = [
  // GET /Room/house/:houseId - Get rooms for a house
  http.get(`${API_BASE}/Room/house/:houseId`, ({ params }) => {
    try {
      const houseId = params.houseId as string;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const rooms = DatabaseQueries.getRoomsByHouseId(Number(houseId));
      return HttpResponse.json(rooms);
    } catch (error) {
      console.error("Room fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Room/:roomId - Get a specific room
  http.get(`${API_BASE}/Room/:roomId`, ({ params }) => {
    try {
      const roomId = params.roomId as string;

      if (!roomId || isNaN(Number(roomId))) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const room = DatabaseQueries.getRoomById(Number(roomId));

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

  // POST /Room - Create a new room
  http.post(`${API_BASE}/Room`, async ({ request }) => {
    try {
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

  // PUT /Room/:roomId - Update a room
  http.put(`${API_BASE}/Room/:roomId`, async ({ params, request }) => {
    try {
      const roomId = params.roomId as string;
      const body = (await request.json()) as Record<string, unknown>;

      if (!roomId || isNaN(Number(roomId))) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
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

      const updatedRoom = DatabaseQueries.updateRoom(Number(roomId), updates);
      return HttpResponse.json(updatedRoom);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return HttpResponse.json({ error: "Room not found" }, { status: 404 });
      }

      console.error("Room update error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // DELETE /Room/:roomId - Delete a room
  http.delete(`${API_BASE}/Room/:roomId`, ({ params }) => {
    try {
      const roomId = params.roomId as string;

      if (!roomId || isNaN(Number(roomId))) {
        return HttpResponse.json({ error: "Invalid room ID" }, { status: 400 });
      }

      const result = DatabaseQueries.deleteRoom(Number(roomId));

      if (!result.success) {
        return HttpResponse.json(
          { error: result.error || "Room not found" },
          { status: 404 }
        );
      }

      return HttpResponse.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Room delete error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),
];
