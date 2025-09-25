import "./App.css";
import { AppMenu } from "./AppMenu";
import { AppRoutes } from "./AppRoutes";

export function AppLayout() {
  return (
    <div>
      <div className="bg-app-primary h-1.5"></div>
      <div className="bg-white mb-1 w-full ">
        <div className="float-left w-full">
          <img src="/Solita.jpg" alt="Logo" className="logo" />
        </div>
      </div>
      <AppMenu />
      <div className="m-4" />
      <AppRoutes />
    </div>
  );
}
