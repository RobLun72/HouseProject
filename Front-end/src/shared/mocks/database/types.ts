// src/test/mocks/database/types.ts
export interface HouseData {
  houseId: number;
  name: string;
  address: string;
  area: number;
}

export interface RoomData {
  roomId: number;
  name: string;
  houseId: number;
  type: string;
  area: number;
  placement: string;
}
