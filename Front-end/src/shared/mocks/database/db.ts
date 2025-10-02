import { factory, primaryKey, oneOf, nullable } from "@mswjs/data";

// Counter-based ID generation for deterministic IDs
let houseIdCounter = 1;
let roomIdCounter = 1;
let temperatureIdCounter = 1;
let userIdCounter = 1;
let auditLogIdCounter = 1;

// Reset all counters (useful for test isolation)
export function resetIdCounters() {
  houseIdCounter = 1;
  roomIdCounter = 1;
  temperatureIdCounter = 1;
  userIdCounter = 1;
  auditLogIdCounter = 1;
}

// Set counters to start after existing seeded data
export function setCountersAfterSeededData() {
  // Find the highest existing IDs in the database
  const houses = db.house.findMany({});
  const rooms = db.room.findMany({});
  const temperatures = db.temperature.findMany({});
  const users = db.user.findMany({});
  const auditLogs = db.auditLog.findMany({});

  // Set counters to be one higher than the max existing ID
  houseIdCounter =
    houses.length > 0 ? Math.max(...houses.map((h) => h.houseId)) + 1 : 1;
  roomIdCounter =
    rooms.length > 0 ? Math.max(...rooms.map((r) => r.roomId)) + 1 : 1;
  temperatureIdCounter =
    temperatures.length > 0
      ? Math.max(...temperatures.map((t) => t.tempId)) + 1
      : 1;
  userIdCounter =
    users.length > 0 ? Math.max(...users.map((u) => u.userId)) + 1 : 1;
  auditLogIdCounter =
    auditLogs.length > 0 ? Math.max(...auditLogs.map((a) => a.logId)) + 1 : 1;

  console.log("📊 MSW ID Counters set after seeded data:", {
    houseIdCounter,
    roomIdCounter,
    temperatureIdCounter,
    userIdCounter,
    auditLogIdCounter,
  });
}

// Define the database schema with relationships
export const db = factory({
  house: {
    houseId: primaryKey(() => houseIdCounter++),
    name: () => "",
    address: nullable(() => ""),
    area: () => 0,
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
  },

  room: {
    roomId: primaryKey(() => roomIdCounter++),
    houseId: () => 0, // Will be set explicitly
    name: () => "",
    type: () => "",
    area: () => 0,
    placement: () => "",
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
    // Relationship: room belongs to house
    house: oneOf("house"),
  },

  temperature: {
    tempId: primaryKey(() => temperatureIdCounter++),
    roomId: () => 0, // Will be set explicitly
    hour: () => 0,
    degrees: () => 20.0,
    date: () => new Date().toISOString().split("T")[0],
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
    // Relationship: temperature belongs to room
    room: oneOf("room"),
  },

  user: {
    userId: primaryKey(() => userIdCounter++),
    username: () => "",
    email: () => "",
    role: () => "user" as "admin" | "user",
    createdAt: () => new Date().toISOString(),
  },

  auditLog: {
    logId: primaryKey(() => auditLogIdCounter++),
    entityType: () => "",
    entityId: () => 0,
    action: () => "create" as "create" | "update" | "delete",
    changes: () => "{}",
    userId: () => 0,
    timestamp: () => new Date().toISOString(),
    // Relationship: audit log belongs to user
    user: oneOf("user"),
  },
});

// Export types for TypeScript support
export type DatabaseHouse = ReturnType<typeof db.house.create>;
export type DatabaseRoom = ReturnType<typeof db.room.create>;
export type DatabaseTemperature = ReturnType<typeof db.temperature.create>;
export type DatabaseUser = ReturnType<typeof db.user.create>;
export type DatabaseAuditLog = ReturnType<typeof db.auditLog.create>;
