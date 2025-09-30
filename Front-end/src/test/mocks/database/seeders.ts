import { db } from "./db";
import { subDays, format } from "date-fns";
import type { HouseData, RoomData } from "./types";

// Import JSON data files
import housesData from "./datafiles/houses.json";
import roomsData from "./datafiles/rooms.json";

export function setupBaseData() {
  // Clear existing data
  db.house.deleteMany({ where: {} });
  db.room.deleteMany({ where: {} });
  db.temperature.deleteMany({ where: {} });
  db.user.deleteMany({ where: {} });
  db.auditLog.deleteMany({ where: {} });

  // Load houses from JSON file
  (housesData as HouseData[]).forEach((houseData) => {
    db.house.create({
      houseId: houseData.houseId,
      name: houseData.name,
      address: houseData.address,
    });
  });

  // Load rooms from JSON file
  (roomsData as RoomData[]).forEach((roomData) => {
    db.room.create({
      roomId: roomData.roomId,
      name: roomData.name,
      houseId: roomData.houseId,
      type: roomData.type,
      area: roomData.area,
      placement: roomData.placement,
    });
  });

  // Create default test users
  db.user.create({
    userId: 1,
    username: "testuser",
    email: "test@example.com",
    role: "user",
  });

  db.user.create({
    userId: 2,
    username: "admin",
    email: "admin@example.com",
    role: "admin",
  });
}

export function setupBaseDataWithTemperatures() {
  // First setup the base data
  setupBaseData();

  // Get all rooms from the loaded data
  const allRooms = db.room.findMany({});

  // Add temperature data for rooms that exist
  if (allRooms.length > 0) {
    seedTemperatureDataForRooms(allRooms);
  }
}

function seedTemperatureDataForRooms(rooms: { roomId: number }[]) {
  const today = new Date();
  const dates = [
    subDays(today, 2), // 2 days ago
    subDays(today, 1), // yesterday
    today, // today
  ];

  rooms.forEach((room) => {
    dates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");

      // Create temperature readings for morning, noon, evening, night
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
    address: "123 Main St",
  });

  const house2 = db.house.create({
    houseId: 2,
    name: "Test House 2",
    address: "456 Oak Ave",
  });

  const house3 = db.house.create({
    houseId: 3,
    name: "Test House 3",
    address: "789 Pine Rd",
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

function seedTemperatureData(rooms: { roomId: number }[]) {
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

function seedAuditLogs(users: { userId: number }[]) {
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
      address: `${h * 100} Performance St`,
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
    address: "999 Empty St",
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
