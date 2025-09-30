import { http, HttpResponse } from "msw";
import { DatabaseQueries } from "../database/queries";

const API_BASE_URL = "http://localhost:5001/api";

export const houseHandlers = [
  // Get all houses
  http.get(`${API_BASE_URL}/houses`, () => {
    try {
      const houses = DatabaseQueries.getAllHouses();
      return HttpResponse.json(houses);
    } catch (error) {
      console.error("Houses fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // Get houses with rooms
  http.get(`${API_BASE_URL}/houses/with-rooms`, () => {
    try {
      const housesWithRooms = DatabaseQueries.getHousesWithRooms();
      return HttpResponse.json(housesWithRooms);
    } catch (error) {
      console.error("Houses with rooms fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // Get single house by ID
  http.get(`${API_BASE_URL}/houses/:id`, ({ params }) => {
    try {
      const houseId = params.id as string;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const house = DatabaseQueries.getHouseById(Number(houseId));

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

  // Create new house
  http.post(`${API_BASE_URL}/houses`, async ({ request }) => {
    try {
      const body = (await request.json()) as Record<string, unknown>;

      // Validate required fields
      if (!body.name || typeof body.name !== "string") {
        return HttpResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const newHouse = DatabaseQueries.createHouse({
        name: body.name as string,
        address: (body.address as string) || null,
      });

      return HttpResponse.json(newHouse, { status: 201 });
    } catch (error) {
      console.error("House creation error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // Update house
  http.put(`${API_BASE_URL}/houses/:id`, async ({ params, request }) => {
    try {
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

      const updatedHouse = DatabaseQueries.updateHouse(Number(houseId), {
        name: body.name as string,
        address: (body.address as string) || null,
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

  // Delete house
  http.delete(`${API_BASE_URL}/houses/:id`, ({ params }) => {
    try {
      const houseId = params.id as string;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      DatabaseQueries.deleteHouse(Number(houseId));
      return HttpResponse.json({ success: true }, { status: 204 });
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

  // Get rooms for a house
  http.get(`${API_BASE_URL}/houses/:id/rooms`, ({ params }) => {
    try {
      const houseId = params.id as string;

      if (!houseId || isNaN(Number(houseId))) {
        return HttpResponse.json(
          { error: "Invalid house ID" },
          { status: 400 }
        );
      }

      const rooms = DatabaseQueries.getRoomsByHouseId(Number(houseId));
      return HttpResponse.json(rooms);
    } catch (error) {
      console.error("House rooms fetch error:", error);
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // Create room for a house
  http.post(`${API_BASE_URL}/houses/:id/rooms`, async ({ params, request }) => {
    try {
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

      const newRoom = DatabaseQueries.createRoom({
        name: body.name as string,
        houseId: Number(houseId),
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
];
