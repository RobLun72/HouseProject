// src/shared/mocks/database/index.ts
import { DatabaseQueries } from "./queries";

export { db, resetIdCounters, setCountersAfterSeededData } from "./db";
export { DatabaseQueries } from "./queries";
export { setupBaseData, setupBaseDataWithTemperatures } from "./seeders";
export type { HouseData, RoomData } from "./types";

// Create database instance that matches our interface
export const createDatabaseInstance = () => ({
  getAllHouses: DatabaseQueries.getAllHouses.bind(DatabaseQueries),
  getHouseById: DatabaseQueries.getHouseById.bind(DatabaseQueries),
  createHouse: DatabaseQueries.createHouse.bind(DatabaseQueries),
  updateHouse: DatabaseQueries.updateHouse.bind(DatabaseQueries),
  deleteHouse: DatabaseQueries.deleteHouse.bind(DatabaseQueries),
  getRoomsByHouseId: DatabaseQueries.getRoomsByHouseId.bind(DatabaseQueries),
  getRoomById: DatabaseQueries.getRoomById.bind(DatabaseQueries),
  createRoom: DatabaseQueries.createRoom.bind(DatabaseQueries),
  updateRoom: DatabaseQueries.updateRoom.bind(DatabaseQueries),
  deleteRoom: DatabaseQueries.deleteRoom.bind(DatabaseQueries),
  getHousesWithRooms: DatabaseQueries.getHousesWithRooms.bind(DatabaseQueries),
  getAvailableDatesForRoom:
    DatabaseQueries.getAvailableDatesForRoom.bind(DatabaseQueries),
  getTemperaturesByRoomAndDate:
    DatabaseQueries.getTemperaturesByRoomAndDate.bind(DatabaseQueries),
  createTemperature: DatabaseQueries.createTemperature.bind(DatabaseQueries),
  updateTemperature: DatabaseQueries.updateTemperature.bind(DatabaseQueries),
  deleteTemperature: DatabaseQueries.deleteTemperature.bind(DatabaseQueries),
});

// Export database initialization for convenience
export const initializeDatabase = () => createDatabaseInstance();
