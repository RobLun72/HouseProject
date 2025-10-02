// src/shared/mocks/types.ts
export interface House {
  houseId: number;
  name: string;
  address: string | null;
  area: number;
}

export interface Room {
  roomId: number;
  name: string;
  houseId: number;
  type: string;
  area: number;
  placement: string;
}

export interface Temperature {
  tempId: number;
  roomId: number;
  hour: number;
  degrees: number;
  date: string;
}

export interface DatabaseQueries {
  getAllHouses: () => House[];
  getHouseById: (houseId: number) => House | null;
  createHouse: (data: {
    name: string;
    address: string | null;
    area: number;
  }) => House;
  updateHouse: (
    houseId: number,
    data: { name?: string; address?: string | null; area?: number }
  ) => House;
  deleteHouse: (houseId: number) => { success: boolean };

  getRoomsByHouseId: (houseId: number) => Room[];
  getRoomById: (roomId: number) => Room | null;
  createRoom: (data: {
    name: string;
    houseId: number;
    type: string;
    area: number;
    placement: string;
  }) => Room;
  updateRoom: (
    roomId: number,
    data: { name?: string; type?: string; area?: number; placement?: string }
  ) => Room;
  deleteRoom: (roomId: number) => { success: boolean };

  getHousesWithRooms: () => (House & { rooms: Room[] })[];
  getAvailableDatesForRoom: (roomId: number) => string[];
  getTemperaturesByRoomAndDate: (roomId: number, date: string) => Temperature[];
  createTemperature: (data: {
    roomId: number;
    hour: number;
    degrees: number;
    date: string;
  }) => Temperature;
  updateTemperature: (
    tempId: number,
    data: { hour?: number; degrees?: number; date?: string }
  ) => Temperature;
  deleteTemperature: (tempId: number) => { success: boolean };
}
