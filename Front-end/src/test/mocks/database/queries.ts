import { db } from "./db";

export class DatabaseQueries {
  // House queries with relationships
  static getAllHouses() {
    return db.house.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }

  static getHousesWithRooms() {
    const houses = db.house.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return houses.map((house) => ({
      ...house,
      rooms: db.room.findMany({
        where: {
          houseId: {
            equals: house.houseId,
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    }));
  }

  static getHouseById(houseId: number) {
    return db.house.findFirst({
      where: {
        houseId: {
          equals: houseId,
        },
      },
    });
  }

  // Room queries
  static getRoomsByHouseId(houseId: number) {
    return db.room.findMany({
      where: {
        houseId: {
          equals: houseId,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static getRoomById(roomId: number) {
    return db.room.findFirst({
      where: {
        roomId: {
          equals: roomId,
        },
      },
    });
  }

  // Temperature queries with complex filtering
  static getTemperaturesByRoomAndDate(roomId: number, date: string) {
    return db.temperature.findMany({
      where: {
        roomId: {
          equals: roomId,
        },
        date: {
          equals: date,
        },
      },
      orderBy: {
        hour: "asc",
      },
    });
  }

  static getAvailableDatesForRoom(roomId: number) {
    const temperatures = db.temperature.findMany({
      where: {
        roomId: {
          equals: roomId,
        },
      },
    });

    // Extract unique dates and sort
    const uniqueDates = Array.from(new Set(temperatures.map((t) => t.date)));
    return uniqueDates.sort();
  }

  static getTemperatureStats(
    roomId: number,
    startDate: string,
    endDate: string
  ) {
    const temperatures = db.temperature.findMany({
      where: {
        roomId: {
          equals: roomId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (temperatures.length === 0) {
      return null;
    }

    const degrees = temperatures.map((t) => t.degrees);
    return {
      count: temperatures.length,
      min: Math.min(...degrees),
      max: Math.max(...degrees),
      average: degrees.reduce((sum, temp) => sum + temp, 0) / degrees.length,
    };
  }

  // House CRUD operations
  static createHouse(data: {
    name: string;
    address?: string | null;
    area?: number;
  }) {
    const house = db.house.create({
      ...data,
      area: data.area || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create audit log
    this.createAuditLog("house", house.houseId, "create", data);

    return house;
  }

  static updateHouse(
    houseId: number,
    updates: {
      name?: string;
      address?: string | null;
      area?: number;
    }
  ) {
    const existing = db.house.findFirst({
      where: { houseId: { equals: houseId } },
    });

    if (!existing) {
      throw new Error(`House ${houseId} not found`);
    }

    const updated = db.house.update({
      where: { houseId: { equals: houseId } },
      data: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });

    // Create audit log
    this.createAuditLog("house", houseId, "update", {
      before: existing,
      after: updates,
    });

    return updated;
  }

  static deleteHouse(houseId: number) {
    const existing = db.house.findFirst({
      where: { houseId: { equals: houseId } },
    });

    if (!existing) {
      throw new Error(`House ${houseId} not found`);
    }

    // Also delete all rooms in the house
    db.room.deleteMany({
      where: { houseId: { equals: houseId } },
    });

    db.house.delete({
      where: { houseId: { equals: houseId } },
    });

    // Create audit log
    this.createAuditLog("house", houseId, "delete", {
      deletedRecord: JSON.parse(JSON.stringify(existing)),
    });

    return { success: true };
  }

  // Room CRUD operations
  static createRoom(data: {
    name: string;
    houseId: number;
    type?: string;
    area?: number;
    placement?: string;
  }) {
    const room = db.room.create({
      name: data.name,
      houseId: data.houseId,
      type: data.type || "General",
      area: data.area || 0,
      placement: data.placement || "Ground Floor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create audit log
    this.createAuditLog("room", room.roomId, "create", data);

    return room;
  }

  static updateRoom(
    roomId: number,
    updates: {
      name?: string;
      type?: string;
      area?: number;
      placement?: string;
    }
  ) {
    const existing = db.room.findFirst({
      where: { roomId: { equals: roomId } },
    });

    if (!existing) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    // Create audit log with before/after
    this.createAuditLog("room", roomId, "update", {
      before: JSON.parse(JSON.stringify(existing)),
      after: updates,
    });

    return db.room.update({
      where: { roomId: { equals: roomId } },
      data: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  static deleteRoom(roomId: number) {
    const existing = db.room.findFirst({
      where: { roomId: { equals: roomId } },
    });

    if (!existing) {
      return { success: false, error: "Room not found" };
    }

    // Delete related temperatures first
    db.temperature.deleteMany({
      where: {
        roomId: { equals: roomId },
      },
    });

    // Delete the room
    const deleteResult = db.room.delete({
      where: { roomId: { equals: roomId } },
    });

    // Create audit log
    this.createAuditLog("room", roomId, "delete", {
      deletedRecord: JSON.parse(JSON.stringify(existing)),
    });

    return { success: true, deletedRoom: deleteResult };
  }

  // Temperature CRUD operations with audit logging
  static createTemperature(data: {
    roomId: number;
    hour: number;
    degrees: number;
    date: string;
  }) {
    const temperature = db.temperature.create({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create audit log
    this.createAuditLog("temperature", temperature.tempId, "create", data);

    return temperature;
  }

  static updateTemperature(
    tempId: number,
    updates: {
      hour?: number;
      degrees?: number;
      date?: string;
    }
  ) {
    const existing = db.temperature.findFirst({
      where: { tempId: { equals: tempId } },
    });

    if (!existing) {
      throw new Error(`Temperature ${tempId} not found`);
    }

    const updated = db.temperature.update({
      where: { tempId: { equals: tempId } },
      data: {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });

    // Create audit log
    this.createAuditLog("temperature", tempId, "update", {
      before: existing,
      after: updates,
    });

    return updated;
  }

  static deleteTemperature(tempId: number) {
    const existing = db.temperature.findFirst({
      where: { tempId: { equals: tempId } },
    });

    if (!existing) {
      throw new Error(`Temperature ${tempId} not found`);
    }

    db.temperature.delete({
      where: { tempId: { equals: tempId } },
    });

    // Create audit log
    this.createAuditLog("temperature", tempId, "delete", {
      deletedRecord: JSON.parse(JSON.stringify(existing)),
    });

    return { success: true };
  }

  // Audit logging helper
  private static createAuditLog(
    entityType: string,
    entityId: number,
    action: "create" | "update" | "delete",
    changes: Record<string, unknown>
  ) {
    db.auditLog.create({
      entityType,
      entityId,
      action,
      changes: JSON.stringify(changes),
      userId: 1, // Default test user
      timestamp: new Date().toISOString(),
    });
  }

  // Advanced query helpers
  static searchHouses(query: string) {
    return db.house.findMany({
      where: {
        name: {
          contains: query,
        },
      },
    });
  }

  static getRecentTemperatureReadings(limit: number = 10) {
    return db.temperature.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static getRoomTemperatureSummary(roomId: number) {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    const allTemperatures = db.temperature.findMany({
      where: { roomId: { equals: roomId } },
    });

    const house = this.getHouseById(room.houseId);

    return {
      room,
      house,
      temperatureCount: allTemperatures.length,
      dateRange: {
        earliest:
          allTemperatures.length > 0
            ? Math.min(
                ...allTemperatures.map((t) => new Date(t.date).getTime())
              )
            : null,
        latest:
          allTemperatures.length > 0
            ? Math.max(
                ...allTemperatures.map((t) => new Date(t.date).getTime())
              )
            : null,
      },
    };
  }
}
