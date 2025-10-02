// src/shared/mocks/database.ts
// Shared database utilities that work for both dev and test environments

export interface DatabaseOperations {
  getAllHouses: () => unknown;
  getHouseById: (id: number) => unknown;
  createHouse: (data: {
    name: string;
    address: string | null;
    area: number;
  }) => unknown;
  updateHouse: (
    id: number,
    data: { name: string; address: string | null; area?: number }
  ) => unknown;
  deleteHouse: (id: number) => unknown;
  getRoomsByHouseId: (houseId: number) => unknown;
  getRoomById: (id: number) => unknown;
  createRoom: (data: {
    name: string;
    houseId: number;
    type?: string;
    area?: number;
    placement?: string;
  }) => unknown;
  updateRoom: (
    id: number,
    data: { name?: string; type?: string; area?: number; placement?: string }
  ) => unknown;
  deleteRoom: (id: number) => unknown;
  getHousesWithRooms: () => unknown;
  getAvailableDatesForRoom: (roomId: number) => unknown;
  getTemperaturesByRoomAndDate: (roomId: number, date: string) => unknown;
  createTemperature: (data: {
    roomId: number;
    hour: number;
    degrees: number;
    date: string;
  }) => unknown;
  updateTemperature: (
    id: number,
    data: { hour?: number; degrees?: number; date?: string }
  ) => unknown;
  deleteTemperature: (id: number) => unknown;
}

// Configuration for different environments
export interface MockEnvironmentConfig {
  environment: "development" | "test";
  logPrefix: string;
  enableRequestLogging: boolean;
  enableDelay: boolean;
}

export const DEV_CONFIG: MockEnvironmentConfig = {
  environment: "development",
  logPrefix: "MSW",
  enableRequestLogging: true,
  enableDelay: true,
};

export const TEST_CONFIG: MockEnvironmentConfig = {
  environment: "test",
  logPrefix: "MSW Test Handler",
  enableRequestLogging: true,
  enableDelay: true,
};
