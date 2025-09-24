import { House } from "@/pages/House/house";
import type { FunctionComponent } from "react";
import { Route, Routes } from "react-router-dom";

export const AppRoutes: FunctionComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<House />} />
    </Routes>
  );
};
