import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App.tsx";

// Enable MSW in development mode if configured
async function enableMocking() {
  console.log("Dev Mode:", import.meta.env.DEV);
  console.log(
    "VITE_ENABLE_MSW_MOCKING:",
    import.meta.env.VITE_ENABLE_MSW_MOCKING
  );
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_MSW_MOCKING === "true"
  ) {
    const { enableMSW } = await import("./shared/mocks/browser");
    return enableMSW();
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
