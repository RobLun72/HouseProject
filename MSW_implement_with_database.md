# MSW Implementation with @mswjs/data In-Memory Database

_Enhanced plan for implementing Mock Service Worker with in-memory database storage for HouseProject frontend testing_

## 🎯 Implementation Overview

This enhanced plan builds upon the standard MSW implementation by integrating **@mswjs/data** to provide a powerful in-memory database for test data management. This approach follows **Frontend-Agent.md** patterns while providing realistic database-like operations for comprehensive component testing.

## 🆕 Enhanced Architecture with @mswjs/data

### Key Advantages of @mswjs/data Integration

- **Relational Data Modeling**: Define models with proper relationships (Houses → Rooms → Temperatures)
- **Database-like Operations**: Support for queries, joins, filtering, and pagination
- **Automatic Data Persistence**: Data persists across multiple API calls within test scenarios
- **Realistic Data Mutations**: CRUD operations that maintain referential integrity
- **Advanced Querying**: Support for complex filtering and sorting operations
- **Transaction-like Behavior**: Rollback capabilities for test isolation

## 📐 Enhanced Project Context

### Current Architecture + Database Layer

- **Frontend**: React + TypeScript + Vite
- **API Integration**: Custom hooks (`useTemperatureApiEnvVariables`, `useApiEnvVariables`)
- **State Management**: Consolidated state pattern with single state objects
- **Testing Database**: @mswjs/data in-memory database with relational models
- **Mock API Layer**: MSW handlers that query the in-memory database
- **Data Seeding**: Automated test data population with relationships

## 🗄️ Database Schema Design

### Entity Relationship Model

```typescript
// Database models following real backend structure
interface DatabaseSchema {
  house: {
    houseId: number; // Primary Key
    name: string;
    area: number;
    createdAt: string;
    updatedAt: string;
  };

  room: {
    roomId: number; // Primary Key
    houseId: number; // Foreign Key → house.houseId
    name: string;
    type: string;
    area: number;
    placement: string;
    createdAt: string;
    updatedAt: string;
  };

  temperature: {
    tempId: number; // Primary Key
    roomId: number; // Foreign Key → room.roomId
    hour: number; // 0-23
    degrees: number; // Decimal temperature
    date: string; // ISO date string
    createdAt: string;
    updatedAt: string;
  };

  // Additional entities for future expansion
  user: {
    userId: number;
    username: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
  };

  auditLog: {
    logId: number;
    entityType: string;
    entityId: number;
    action: "create" | "update" | "delete";
    changes: string; // JSON string of changes
    userId: number; // Foreign Key → user.userId
    timestamp: string;
  };
}
```

## 🧪 Enhanced MSW Implementation Strategy

### Phase 1: Foundation Setup with Database

#### 1.1 Enhanced Dependencies Installation

```bash
# Core testing dependencies (same as before)
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev vitest jsdom @vitest/ui @vitest/coverage-v8
npm install --save-dev msw

# Enhanced: @mswjs/data for in-memory database
npm install --save-dev @mswjs/data

# TypeScript support
npm install --save-dev @types/jest

# Additional utilities for date manipulation and data generation
npm install --save-dev date-fns faker
```

#### 1.2 Enhanced Test Configuration

**`vitest.config.ts`** - Same as standard implementation

**`src/test/setup.ts`** - Enhanced with database initialization

```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, beforeEach } from "vitest";
import { server } from "./mocks/server";
import { db } from "./mocks/database/db";

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Reset database and handlers before each test
beforeEach(() => {
  // Reset database to clean state
  db.house.deleteMany({ where: {} });
  db.room.deleteMany({ where: {} });
  db.temperature.deleteMany({ where: {} });
  db.user.deleteMany({ where: {} });
  db.auditLog.deleteMany({ where: {} });

  // Reseed with fresh test data
  seedTestDatabase();
});

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_TEMPERATURE_API_URL: "http://localhost:5001/api",
    VITE_TEMPERATURE_API_KEY: "test-api-key",
    VITE_HOUSE_API_URL: "http://localhost:5000/api",
    VITE_HOUSE_API_KEY: "test-house-api-key",
  },
  writable: true,
});

// Import seeding function
function seedTestDatabase() {
  // Will be implemented in database setup phase
}
```

### Phase 2: Database Infrastructure

#### 2.1 Database Model Definition

**`src/test/mocks/database/db.ts`** - Main database setup

```typescript
import { factory, primaryKey, manyOf, oneOf, nullable } from "@mswjs/data";

// Define the database schema with relationships
export const db = factory({
  house: {
    houseId: primaryKey(() => Math.floor(Math.random() * 10000)),
    name: () => "",
    area: () => 0,
    createdAt: () => new Date().toISOString(),
    updatedAt: () => new Date().toISOString(),
  },

  room: {
    roomId: primaryKey(() => Math.floor(Math.random() * 10000)),
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
    tempId: primaryKey(() => Math.floor(Math.random() * 10000)),
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
    userId: primaryKey(() => Math.floor(Math.random() * 10000)),
    username: () => "",
    email: () => "",
    role: () => "user" as "admin" | "user",
    createdAt: () => new Date().toISOString(),
  },

  auditLog: {
    logId: primaryKey(() => Math.floor(Math.random() * 10000)),
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
```

#### 2.2 Database Seeding and Management

**`src/test/mocks/database/seeders.ts`** - Database seeding functions

```typescript
import { db } from "./db";
import { addDays, subDays, format } from "date-fns";

export function seedTestDatabase() {
  // Clear existing data
  db.house.deleteMany({ where: {} });
  db.room.deleteMany({ where: {} });
  db.temperature.deleteMany({ where: {} });
  db.user.deleteMany({ where: {} });
  db.auditLog.deleteMany({ where: {} });

  // Create test users
  const testUser = db.user.create({
    userId: 1,
    username: "testuser",
    email: "test@example.com",
    role: "user",
  });

  const adminUser = db.user.create({
    userId: 2,
    username: "admin",
    email: "admin@example.com",
    role: "admin",
  });

  // Create test houses
  const house1 = db.house.create({
    houseId: 1,
    name: "Test House 1",
    area: 1200,
  });

  const house2 = db.house.create({
    houseId: 2,
    name: "Test House 2",
    area: 800,
  });

  const house3 = db.house.create({
    houseId: 3,
    name: "Test House 3",
    area: 1500,
  });

  // Create rooms for houses
  const livingRoom = db.room.create({
    roomId: 1,
    houseId: house1.houseId,
    name: "Living Room",
    type: "Living",
    area: 350,
    placement: "Ground Floor",
  });

  const kitchen = db.room.create({
    roomId: 2,
    houseId: house1.houseId,
    name: "Kitchen",
    type: "Kitchen",
    area: 200,
    placement: "Ground Floor",
  });

  const bedroom1 = db.room.create({
    roomId: 3,
    houseId: house2.houseId,
    name: "Master Bedroom",
    type: "Bedroom",
    area: 250,
    placement: "Upper Floor",
  });

  const bedroom2 = db.room.create({
    roomId: 4,
    houseId: house2.houseId,
    name: "Guest Bedroom",
    type: "Bedroom",
    area: 180,
    placement: "Upper Floor",
  });

  const office = db.room.create({
    roomId: 5,
    houseId: house3.houseId,
    name: "Home Office",
    type: "Office",
    area: 150,
    placement: "Ground Floor",
  });

  // Create temperature readings for multiple days
  seedTemperatureData([livingRoom, kitchen, bedroom1, bedroom2, office]);

  // Create audit logs for actions
  seedAuditLogs([testUser, adminUser]);
}

function seedTemperatureData(rooms: any[]) {
  const today = new Date();
  const dates = [
    subDays(today, 2), // 2 days ago
    subDays(today, 1), // yesterday
    today, // today
  ];

  rooms.forEach((room) => {
    dates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");

      // Create multiple temperature readings per day (morning, noon, evening)
      const hours = [8, 12, 18, 22]; // 8 AM, 12 PM, 6 PM, 10 PM

      hours.forEach((hour) => {
        // Generate realistic temperature variations
        const baseTemp = 20 + Math.random() * 5; // 20-25°C base
        const hourVariation = hour < 12 ? -2 : hour > 18 ? -1 : 2;
        const degrees = Math.round((baseTemp + hourVariation) * 10) / 10;

        db.temperature.create({
          roomId: room.roomId,
          hour,
          degrees,
          date: dateStr,
        });
      });
    });
  });
}

function seedAuditLogs(users: any[]) {
  // Create sample audit log entries
  const actions = ["create", "update", "delete"] as const;
  const entityTypes = ["house", "room", "temperature"];

  for (let i = 0; i < 10; i++) {
    db.auditLog.create({
      entityType: entityTypes[Math.floor(Math.random() * entityTypes.length)],
      entityId: Math.floor(Math.random() * 100),
      action: actions[Math.floor(Math.random() * actions.length)],
      changes: JSON.stringify({
        field: "example",
        oldValue: "old",
        newValue: "new",
      }),
      userId: users[Math.floor(Math.random() * users.length)].userId,
    });
  }
}

// Specialized seeding functions for specific test scenarios
export function seedLargeDataset() {
  // Seed large amounts of data for performance testing
  for (let h = 1; h <= 50; h++) {
    const house = db.house.create({
      houseId: h + 1000,
      name: `Performance Test House ${h}`,
      area: 800 + Math.random() * 1000,
    });

    // 3-5 rooms per house
    const roomCount = 3 + Math.floor(Math.random() * 3);
    for (let r = 1; r <= roomCount; r++) {
      const room = db.room.create({
        roomId: h * 10 + r + 1000,
        houseId: house.houseId,
        name: `Room ${r}`,
        type: ["Living", "Bedroom", "Kitchen", "Bathroom"][
          Math.floor(Math.random() * 4)
        ],
        area: 100 + Math.random() * 200,
        placement: Math.random() > 0.5 ? "Ground Floor" : "Upper Floor",
      });

      // Temperature data for last 30 days
      for (let d = 0; d < 30; d++) {
        const date = format(subDays(new Date(), d), "yyyy-MM-dd");
        for (let hour = 0; hour < 24; hour += 4) {
          // Every 4 hours
          db.temperature.create({
            roomId: room.roomId,
            hour,
            degrees: 18 + Math.random() * 8, // 18-26°C
            date,
          });
        }
      }
    }
  }
}

export function seedEdgeCaseData() {
  // Create data for edge case testing

  // House with no rooms
  db.house.create({
    houseId: 9999,
    name: "Empty House",
    area: 100,
  });

  // Room with no temperature data
  db.room.create({
    roomId: 9999,
    houseId: 1, // Existing house
    name: "Cold Room",
    type: "Storage",
    area: 50,
    placement: "Basement",
  });

  // Temperature with extreme values
  db.temperature.create({
    roomId: 1, // Existing room
    hour: 0,
    degrees: -10.5, // Extreme cold
    date: format(new Date(), "yyyy-MM-dd"),
  });

  db.temperature.create({
    roomId: 1, // Existing room
    hour: 23,
    degrees: 45.0, // Extreme heat
    date: format(new Date(), "yyyy-MM-dd"),
  });
}
```

#### 2.3 Database Query Utilities

**`src/test/mocks/database/queries.ts`** - Database query helpers

```typescript
import { db } from "./db";

export class DatabaseQueries {
  // House queries with relationships
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

  // CRUD operations with audit logging
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
    this.createAuditLog("temperature", tempId, "delete", existing);

    return { success: true };
  }

  // Audit logging helper
  private static createAuditLog(
    entityType: string,
    entityId: number,
    action: "create" | "update" | "delete",
    changes: any
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
```

### Phase 3: Enhanced MSW Handlers

#### 3.1 Database-Powered API Handlers

**`src/test/mocks/handlers/temperatureHandlers.ts`** - Enhanced with database queries

```typescript
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
      const body = (await request.json()) as any;

      // Validate request body
      const validationErrors = validateTemperatureData(body);
      if (validationErrors.length > 0) {
        return HttpResponse.json(
          { error: "Validation failed", details: validationErrors },
          { status: 400 }
        );
      }

      const updatedTemperature = DatabaseQueries.updateTemperature(tempId, {
        hour: body.hour,
        degrees: body.degrees,
        date: body.date,
      });

      return HttpResponse.json(updatedTemperature);
    } catch (error: any) {
      if (error.message.includes("not found")) {
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
      const body = (await request.json()) as any;

      // Validate request body
      const validationErrors = validateTemperatureData(body);
      if (validationErrors.length > 0) {
        return HttpResponse.json(
          { error: "Validation failed", details: validationErrors },
          { status: 400 }
        );
      }

      // Check if room exists
      const room = DatabaseQueries.getRoomById(body.roomId);
      if (!room) {
        return HttpResponse.json({ error: "Room not found" }, { status: 404 });
      }

      const newTemperature = DatabaseQueries.createTemperature({
        roomId: body.roomId,
        hour: body.hour,
        degrees: body.degrees,
        date: body.date,
      });

      return HttpResponse.json(newTemperature, { status: 201 });
    } catch (error) {
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
    } catch (error: any) {
      if (error.message.includes("not found")) {
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
    ({ params, request, url }) => {
      const apiKey = request.headers.get("X-Api-Key");
      const roomId = parseInt(params.roomId as string);
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
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  ),
];

// Validation helper function
function validateTemperatureData(data: any): string[] {
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
```

**`src/test/mocks/handlers/houseHandlers.ts`** - Enhanced house handlers

```typescript
import { HttpResponse, http } from "msw";
import { DatabaseQueries } from "../database/queries";

const API_BASE = "http://localhost:5000/api";

export const houseHandlers = [
  // GET /Houses - Database-powered house listing
  http.get(`${API_BASE}/Houses`, ({ request, url }) => {
    const apiKey = request.headers.get("X-Api-Key");

    if (!apiKey || apiKey !== "test-house-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const search = url.searchParams.get("search");

      let houses;
      if (search) {
        houses = DatabaseQueries.searchHouses(search);
      } else {
        houses = DatabaseQueries.getHousesWithRooms().map((h) => ({
          houseId: h.houseId,
          name: h.name,
          area: h.area,
          createdAt: h.createdAt,
          updatedAt: h.updatedAt,
        }));
      }

      return HttpResponse.json({ houses });
    } catch (error) {
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Houses/{houseId} - Get single house with rooms
  http.get(`${API_BASE}/Houses/:houseId`, ({ params, request }) => {
    const apiKey = request.headers.get("X-Api-Key");
    const houseId = parseInt(params.houseId as string);

    if (!apiKey || apiKey !== "test-house-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(houseId)) {
      return HttpResponse.json({ error: "Invalid house ID" }, { status: 400 });
    }

    try {
      const house = DatabaseQueries.getHouseById(houseId);
      if (!house) {
        return HttpResponse.json({ error: "House not found" }, { status: 404 });
      }

      const rooms = DatabaseQueries.getRoomsByHouseId(houseId);

      return HttpResponse.json({
        ...house,
        rooms,
      });
    } catch (error) {
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),

  // GET /Houses/{houseId}/rooms - Get rooms for a house
  http.get(`${API_BASE}/Houses/:houseId/rooms`, ({ params, request }) => {
    const apiKey = request.headers.get("X-Api-Key");
    const houseId = parseInt(params.houseId as string);

    if (!apiKey || apiKey !== "test-house-api-key") {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(houseId)) {
      return HttpResponse.json({ error: "Invalid house ID" }, { status: 400 });
    }

    try {
      const rooms = DatabaseQueries.getRoomsByHouseId(houseId);
      return HttpResponse.json(rooms);
    } catch (error) {
      return HttpResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }),
];
```

### Phase 4: Enhanced Test Utilities

#### 4.1 Database-Aware Test Utilities

**`src/test/utils/databaseHelpers.ts`** - Database testing utilities

```typescript
import { db } from "../mocks/database/db";
import {
  seedTestDatabase,
  seedLargeDataset,
  seedEdgeCaseData,
} from "../mocks/database/seeders";

export class DatabaseTestHelpers {
  // Database state management
  static resetDatabase() {
    db.house.deleteMany({ where: {} });
    db.room.deleteMany({ where: {} });
    db.temperature.deleteMany({ where: {} });
    db.user.deleteMany({ where: {} });
    db.auditLog.deleteMany({ where: {} });
  }

  static seedStandardData() {
    this.resetDatabase();
    seedTestDatabase();
  }

  static seedLargeDataset() {
    this.resetDatabase();
    seedTestDatabase();
    seedLargeDataset();
  }

  static seedEdgeCases() {
    this.resetDatabase();
    seedTestDatabase();
    seedEdgeCaseData();
  }

  // Custom data creation for specific tests
  static createTestHouse(overrides: Partial<any> = {}) {
    return db.house.create({
      name: "Test House",
      area: 1000,
      ...overrides,
    });
  }

  static createTestRoom(houseId: number, overrides: Partial<any> = {}) {
    return db.room.create({
      houseId,
      name: "Test Room",
      type: "Living",
      area: 200,
      placement: "Ground Floor",
      ...overrides,
    });
  }

  static createTestTemperature(roomId: number, overrides: Partial<any> = {}) {
    return db.temperature.create({
      roomId,
      hour: 12,
      degrees: 22.0,
      date: new Date().toISOString().split("T")[0],
      ...overrides,
    });
  }

  // Query helpers for test assertions
  static getHouseCount() {
    return db.house.findMany({}).length;
  }

  static getRoomCount() {
    return db.room.findMany({}).length;
  }

  static getTemperatureCount() {
    return db.temperature.findMany({}).length;
  }

  static findHouseByName(name: string) {
    return db.house.findFirst({
      where: { name: { equals: name } },
    });
  }

  static findRoomsByHouse(houseId: number) {
    return db.room.findMany({
      where: { houseId: { equals: houseId } },
    });
  }

  static findTemperaturesByRoom(roomId: number) {
    return db.temperature.findMany({
      where: { roomId: { equals: roomId } },
    });
  }

  // Data verification helpers
  static verifyDatabaseState(expectedState: {
    houses?: number;
    rooms?: number;
    temperatures?: number;
  }) {
    const actual = {
      houses: this.getHouseCount(),
      rooms: this.getRoomCount(),
      temperatures: this.getTemperatureCount(),
    };

    const expected = {
      houses: expectedState.houses ?? actual.houses,
      rooms: expectedState.rooms ?? actual.rooms,
      temperatures: expectedState.temperatures ?? actual.temperatures,
    };

    return {
      matches: JSON.stringify(actual) === JSON.stringify(expected),
      actual,
      expected,
    };
  }

  // Performance testing helpers
  static measureQueryPerformance<T>(
    queryFn: () => T,
    description: string
  ): { result: T; duration: number } {
    const start = performance.now();
    const result = queryFn();
    const duration = performance.now() - start;

    console.log(`${description}: ${duration.toFixed(2)}ms`);

    return { result, duration };
  }

  // Data export/import for complex test scenarios
  static exportDatabaseState() {
    return {
      houses: db.house.findMany({}),
      rooms: db.room.findMany({}),
      temperatures: db.temperature.findMany({}),
      users: db.user.findMany({}),
      auditLogs: db.auditLog.findMany({}),
    };
  }

  static importDatabaseState(
    state: ReturnType<typeof DatabaseTestHelpers.exportDatabaseState>
  ) {
    this.resetDatabase();

    state.users.forEach((user) => db.user.create(user));
    state.houses.forEach((house) => db.house.create(house));
    state.rooms.forEach((room) => db.room.create(room));
    state.temperatures.forEach((temp) => db.temperature.create(temp));
    state.auditLogs.forEach((log) => db.auditLog.create(log));
  }
}
```

**`src/test/utils/testUtils.tsx`** - Enhanced with database utilities

```typescript
import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DatabaseTestHelpers } from "./databaseHelpers";

// All the providers you need for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Enhanced render function with database options
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  databaseState?: "standard" | "large" | "edge-cases" | "empty";
  customSeed?: () => void;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { databaseState = "standard", customSeed, ...renderOptions } = options;

  // Setup database state before rendering
  if (customSeed) {
    customSeed();
  } else {
    switch (databaseState) {
      case "large":
        DatabaseTestHelpers.seedLargeDataset();
        break;
      case "edge-cases":
        DatabaseTestHelpers.seedEdgeCases();
        break;
      case "empty":
        DatabaseTestHelpers.resetDatabase();
        break;
      case "standard":
      default:
        DatabaseTestHelpers.seedStandardData();
        break;
    }
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

export * from "@testing-library/react";
export { customRender as render };
export { DatabaseTestHelpers };
```

### Phase 5: Enhanced Component Tests

#### 5.1 Database-Powered Component Tests

**`src/pages/Temperature/__tests__/houseTemperatures.enhanced.test.tsx`** - Enhanced with database testing

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@/test/utils/testUtils";
import { HouseTemperatures } from "../houseTemperatures";
import { DatabaseTestHelpers } from "@/test/utils/databaseHelpers";
import { mockApiError } from "@/test/utils/mockHelpers";

describe("HouseTemperatures (Database-Enhanced)", () => {
  describe("Database Integration", () => {
    it("renders houses from database with correct room counts", async () => {
      render(<HouseTemperatures />, { databaseState: "standard" });

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Verify database state matches UI
      const dbState = DatabaseTestHelpers.verifyDatabaseState({
        houses: 3, // Standard seed has 3 houses
        rooms: 5, // Total of 5 rooms across all houses
      });
      expect(dbState.matches).toBe(true);

      // Check UI reflects database state
      expect(screen.getByText("Test House 1")).toBeInTheDocument();
      expect(screen.getByText("Test House 2")).toBeInTheDocument();
      expect(screen.getByText("Test House 3")).toBeInTheDocument();

      // House 1 should show 2 rooms
      expect(screen.getByText("1,200 sq m • 2 rooms")).toBeInTheDocument();
      // House 2 should show 2 rooms
      expect(screen.getByText("800 sq m • 2 rooms")).toBeInTheDocument();
      // House 3 should show 1 room
      expect(screen.getByText("1,500 sq m • 1 room")).toBeInTheDocument();
    });

    it("handles empty database state gracefully", async () => {
      render(<HouseTemperatures />, { databaseState: "empty" });

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("No houses found.")).toBeInTheDocument();

      // Verify database is actually empty
      const dbState = DatabaseTestHelpers.verifyDatabaseState({
        houses: 0,
        rooms: 0,
        temperatures: 0,
      });
      expect(dbState.matches).toBe(true);
    });

    it("displays rooms when house accordion is expanded", async () => {
      render(<HouseTemperatures />, { databaseState: "standard" });

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Expand first house accordion
      const house1Accordion = screen.getByText("Test House 1");
      fireEvent.click(house1Accordion);

      // Wait for rooms to be displayed
      await waitFor(() => {
        expect(screen.getByText("Living Room")).toBeInTheDocument();
        expect(screen.getByText("Kitchen")).toBeInTheDocument();
      });

      // Verify rooms match database
      const house1 = DatabaseTestHelpers.findHouseByName("Test House 1");
      expect(house1).toBeTruthy();

      if (house1) {
        const rooms = DatabaseTestHelpers.findRoomsByHouse(house1.houseId);
        expect(rooms).toHaveLength(2);
        expect(rooms.map((r) => r.name)).toContain("Living Room");
        expect(rooms.map((r) => r.name)).toContain("Kitchen");
      }
    });

    it("handles large datasets without performance issues", async () => {
      // Test with large dataset
      const { duration } = DatabaseTestHelpers.measureQueryPerformance(
        () => render(<HouseTemperatures />, { databaseState: "large" }),
        "Large dataset render"
      );

      await waitFor(
        () => {
          expect(
            screen.queryByText("Loading houses...")
          ).not.toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Should handle large datasets reasonably quickly (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds max

      // Should display houses (even if many)
      expect(screen.getByText("Test House 1")).toBeInTheDocument();
    });
  });

  describe("Database State Persistence", () => {
    it("maintains database state across component re-renders", async () => {
      const { rerender } = render(<HouseTemperatures />, {
        databaseState: "standard",
      });

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Capture initial database state
      const initialState = DatabaseTestHelpers.exportDatabaseState();

      // Re-render component
      rerender(<HouseTemperatures />);

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Database state should be unchanged
      const afterRerenderState = DatabaseTestHelpers.exportDatabaseState();
      expect(JSON.stringify(initialState)).toBe(
        JSON.stringify(afterRerenderState)
      );
    });

    it("handles database modifications during component lifecycle", async () => {
      render(<HouseTemperatures />, { databaseState: "standard" });

      await waitFor(() => {
        expect(screen.getByText("Test House 1")).toBeInTheDocument();
      });

      // Modify database while component is mounted
      const newHouse = DatabaseTestHelpers.createTestHouse({
        name: "Dynamic House",
        area: 2000,
      });

      // Component won't automatically reflect changes (this is expected behavior)
      // But database should have the new house
      const foundHouse = DatabaseTestHelpers.findHouseByName("Dynamic House");
      expect(foundHouse).toBeTruthy();
      expect(foundHouse?.houseId).toBe(newHouse.houseId);
    });
  });

  describe("Edge Cases with Database", () => {
    it("handles houses with no rooms", async () => {
      render(<HouseTemperatures />, { databaseState: "edge-cases" });

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Should display empty house
      expect(screen.getByText("Empty House")).toBeInTheDocument();

      // Expand empty house
      const emptyHouse = screen.getByText("Empty House");
      fireEvent.click(emptyHouse);

      await waitFor(() => {
        expect(
          screen.getByText("No rooms found for this house.")
        ).toBeInTheDocument();
      });
    });

    it("displays correct room count for edge cases", async () => {
      render(<HouseTemperatures />, { databaseState: "edge-cases" });

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      // Empty house should show 0 rooms
      expect(screen.getByText("100 sq m • 0 rooms")).toBeInTheDocument();
    });
  });

  describe("Custom Database Scenarios", () => {
    it("works with custom seeded data", async () => {
      render(<HouseTemperatures />, {
        customSeed: () => {
          DatabaseTestHelpers.resetDatabase();

          // Create custom test scenario
          const house = DatabaseTestHelpers.createTestHouse({
            name: "Custom Test House",
            area: 999,
          });

          DatabaseTestHelpers.createTestRoom(house.houseId, {
            name: "Custom Room 1",
            type: "Custom",
          });

          DatabaseTestHelpers.createTestRoom(house.houseId, {
            name: "Custom Room 2",
            type: "Custom",
          });
        },
      });

      await waitFor(() => {
        expect(screen.queryByText("Loading houses...")).not.toBeInTheDocument();
      });

      expect(screen.getByText("Custom Test House")).toBeInTheDocument();
      expect(screen.getByText("999 sq m • 2 rooms")).toBeInTheDocument();

      // Expand and verify custom rooms
      fireEvent.click(screen.getByText("Custom Test House"));

      await waitFor(() => {
        expect(screen.getByText("Custom Room 1")).toBeInTheDocument();
        expect(screen.getByText("Custom Room 2")).toBeInTheDocument();
      });
    });
  });
});
```

## 📋 Enhanced Implementation Todo List

### Phase 1: Foundation Setup with Database ⚡ HIGH PRIORITY

- [ ] **Install enhanced dependencies**

  - Install all standard testing dependencies (@testing-library/\*, vitest, msw)
  - Install @mswjs/data for in-memory database
  - Install date-fns and faker for data utilities
  - Install TypeScript types

- [ ] **Create enhanced test configuration**
  - Create `vitest.config.ts` with React plugin and jsdom environment
  - Create enhanced `src/test/setup.ts` with database initialization
  - Update `package.json` with test scripts
  - Configure path aliases and global test settings

### Phase 2: Database Infrastructure ⚡ HIGH PRIORITY

- [ ] **Setup database models and schema**

  - Create `src/test/mocks/database/db.ts` with @mswjs/data factory
  - Define House, Room, Temperature, User, AuditLog models
  - Setup relationships between entities
  - Add TypeScript types for database entities

- [ ] **Create database seeding system**

  - Create `src/test/mocks/database/seeders.ts` with seeding functions
  - Implement `seedTestDatabase()` for standard test data
  - Implement `seedLargeDataset()` for performance testing
  - Implement `seedEdgeCaseData()` for edge case scenarios
  - Add realistic temperature data generation across multiple days

- [ ] **Implement database query utilities**
  - Create `src/test/mocks/database/queries.ts` with DatabaseQueries class
  - Implement complex relationship queries (houses with rooms, temperature stats)
  - Add CRUD operations with audit logging
  - Implement search and filtering capabilities
  - Add data validation and error handling

### Phase 3: Enhanced MSW Handlers 🔧 HIGH PRIORITY

- [ ] **Create database-powered API handlers**

  - Enhance `src/test/mocks/handlers/temperatureHandlers.ts` with database queries
  - Enhance `src/test/mocks/handlers/houseHandlers.ts` with database operations
  - Add comprehensive request validation
  - Implement proper error responses with status codes
  - Add new endpoints for statistics and advanced queries

- [ ] **Add handler validation and error scenarios**
  - Implement request body validation for all endpoints
  - Add realistic error responses (404, 400, 500)
  - Add API key validation across all handlers
  - Implement rate limiting simulation (optional)

### Phase 4: Enhanced Test Utilities 🧪 HIGH PRIORITY

- [ ] **Create database-aware test utilities**

  - Create `src/test/utils/databaseHelpers.ts` with DatabaseTestHelpers class
  - Implement database state management (reset, seed, verify)
  - Add custom data creation helpers
  - Implement performance measurement utilities
  - Add database state export/import for complex scenarios

- [ ] **Enhance render utilities with database options**
  - Update `src/test/utils/testUtils.tsx` with database state options
  - Add support for custom seeding functions
  - Integrate database helpers with render function
  - Add database state verification capabilities

### Phase 5: Enhanced Component Testing 🧪 HIGH PRIORITY

- [ ] **Create database-enhanced HouseTemperatures tests**

  - Create comprehensive test suite with database integration
  - Test component behavior with different database states
  - Add performance testing with large datasets
  - Test edge cases with missing/invalid data
  - Verify UI accurately reflects database state

- [ ] **Create database-enhanced ReportTemperature tests**
  - Test sequential selection flow with real database queries
  - Test CRUD operations against database
  - Test form validation with database constraints
  - Test error scenarios with database failures
  - Add complex workflow testing

### Phase 6: Advanced Database Features 🚀 MEDIUM PRIORITY

- [ ] **Add advanced query testing**

  - Test complex filtering and sorting operations
  - Test pagination and large dataset handling
  - Add performance benchmarking for database operations
  - Test transaction-like behavior and rollbacks

- [ ] **Add audit logging and tracking**

  - Test audit log creation for all CRUD operations
  - Verify user tracking in audit logs
  - Test audit log querying and filtering
  - Add audit log cleanup and maintenance

- [ ] **Add data integrity testing**
  - Test referential integrity constraints
  - Test cascade delete operations
  - Verify foreign key relationships
  - Test data validation rules

### Phase 7: Integration and Performance 🔄 MEDIUM PRIORITY

- [ ] **Add integration testing scenarios**

  - Test complete user workflows with database persistence
  - Test component interactions with shared database state
  - Add cross-component data consistency testing
  - Test navigation with database state preservation

- [ ] **Add performance and scalability testing**
  - Benchmark database operations with large datasets
  - Test memory usage with extensive data
  - Add query optimization verification
  - Test concurrent access scenarios

### Phase 8: CI/CD and Documentation 📝 LOW PRIORITY

- [ ] **Setup continuous testing with database**

  - Add database performance monitoring to CI
  - Configure database state verification in pipeline
  - Add test data consistency checks
  - Setup automated performance regression testing

- [ ] **Create comprehensive documentation**
  - Document database schema and relationships
  - Create testing patterns and best practices guide
  - Add troubleshooting guide for database issues
  - Document performance optimization techniques

## 🎯 Enhanced Success Criteria

### Functional Requirements ✅

- [ ] All API calls are backed by persistent in-memory database
- [ ] Database maintains referential integrity across operations
- [ ] Components work correctly with realistic relational data
- [ ] CRUD operations are fully tested with database persistence
- [ ] Complex queries and relationships work correctly

### Quality Requirements 📊

- [ ] Achieve 90%+ test coverage on database-integrated components
- [ ] Database operations complete within performance thresholds
- [ ] All edge cases and error scenarios are covered
- [ ] Tests provide realistic integration testing experience
- [ ] Database state is properly isolated between tests

### Performance Requirements ⚡

- [ ] Database queries complete within 10ms for standard operations
- [ ] Large dataset operations complete within 100ms
- [ ] Memory usage remains stable across test runs
- [ ] Test suite completes within 30 seconds for full coverage

### Integration Requirements 🔗

- [ ] Database schema matches production API contracts
- [ ] All relationships and constraints are properly enforced
- [ ] Error handling matches production API behavior
- [ ] Audit logging captures all data modifications

## 🔧 Enhanced Maintenance Considerations

### Database Schema Evolution

- **Version Control**: Track database schema changes alongside API changes
- **Migration Testing**: Test schema updates and data migrations
- **Backward Compatibility**: Ensure tests work across API versions
- **Performance Monitoring**: Track query performance over time

### Data Management

- **Seed Data Maintenance**: Keep test data current with production patterns
- **Edge Case Discovery**: Add new edge cases as they're discovered
- **Performance Benchmarks**: Update performance expectations as system grows
- **Memory Management**: Monitor and optimize memory usage patterns

### Best Practices

- **Follow Frontend-Agent.md patterns** for component and state management
- **Use realistic data** that mirrors production scenarios
- **Test database constraints** as thoroughly as business logic
- **Maintain test isolation** while preserving relational integrity
- **Document complex scenarios** for future developers

## 📝 Enhanced Expected Deliverables

### 🗄️ Database Infrastructure

- Complete relational database schema with 5+ entity types
- Automated seeding system with multiple data scenarios
- Advanced query utilities with filtering, sorting, and statistics
- Audit logging system for all data modifications

### 🧪 Enhanced Tests

- 25+ test cases for HouseTemperatures with database integration
- 30+ test cases for ReportTemperature with CRUD operations
- Performance tests with large datasets (1000+ records)
- Edge case tests with data constraints and validation

### 📊 Quality Assurance

- 90%+ coverage on database-integrated components
- Sub-100ms database operation performance
- Comprehensive error scenario coverage
- Integration testing across component boundaries

### 🚀 Developer Experience

- Database-aware test utilities for easy test creation
- Performance monitoring and benchmarking tools
- Realistic test data that mirrors production patterns
- Clear documentation and usage examples

---

_Enhanced implementation follows Frontend-Agent.md patterns with powerful @mswjs/data database integration_
_Total estimated implementation time: 24-30 hours across 8 development phases_
_Provides enterprise-grade testing infrastructure with realistic data persistence_
