import { House } from "@/pages/House/house";
import { HouseAdd } from "@/pages/House/houseAdd";
import { HouseEdit } from "@/pages/House/houseEdit";
import { Room } from "@/pages/Rooms/room";
import { RoomAdd } from "@/pages/Rooms/roomAdd";
import { RoomEdit } from "@/pages/Rooms/roomEdit";
import { HouseTemperatures } from "@/pages/Temperature/houseTemperatures";
import type { FunctionComponent } from "react";
import { Route, Routes } from "react-router-dom";

export const AppRoutes: FunctionComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<House />} />
      <Route path="/house/add" element={<HouseAdd />} />
      <Route path="/house/edit/:houseId" element={<HouseEdit />} />
      <Route path="/house/:houseId/rooms" element={<Room />} />
      <Route path="/house/:houseId/rooms/add" element={<RoomAdd />} />
      <Route path="/house/:houseId/rooms/edit/:roomId" element={<RoomEdit />} />
      <Route path="/temperature" element={<HouseTemperatures />} />
    </Routes>
  );
};
