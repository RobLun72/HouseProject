// src/shared/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { createHouseHandlers } from "./handlers/house";
import { createRoomHandlers } from "./handlers/room";
import { createTemperatureHandlers } from "./handlers/temperature";
import { createDevelopmentConfig } from "./handlers/config";

// Environment variable configuration
const isMSWEnabled = import.meta.env.VITE_ENABLE_MSW_MOCKING === "true";
const apiDelay = parseInt(import.meta.env.VITE_MSW_API_DELAY || "0", 10);
const showWarnings = import.meta.env.VITE_MSW_WARN === "true";

export async function enableMSW() {
  if (!isMSWEnabled) {
    if (import.meta.env.DEV) {
      console.log("MSW mocking is disabled via VITE_ENABLE_MSW_MOCKING");
    }
    return;
  }

  if (import.meta.env.DEV) {
    console.log("Starting MSW in development mode...");

    // Initialize the MSW database with seeded data
    console.log("Setting up MSW database with base data and temperatures...");

    // Import the database modules dynamically to avoid Node.js dependencies in build
    const { DatabaseQueries } = await import("./database/queries");
    const { setupBaseDataWithTemperatures } = await import(
      "./database/seeders"
    );

    // Seed the database with base data and temperatures
    setupBaseDataWithTemperatures();

    console.log("MSW database initialized with base data and temperatures");

    // Create configuration and handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = createDevelopmentConfig(() => DatabaseQueries as any);
    const handlers = [
      ...createHouseHandlers(config),
      ...createRoomHandlers(config),
      ...createTemperatureHandlers(config),
    ];

    // Create and start the worker
    const worker = setupWorker(...handlers);

    // Log the API URLs being intercepted
    console.log("MSW will intercept calls to:");
    console.log("- House API:", import.meta.env.VITE_HOUSE_API_URL);
    console.log("- Temperature API:", import.meta.env.VITE_TEMPERATURE_API_URL);

    // Start the worker with custom configuration
    await worker.start({
      onUnhandledRequest: showWarnings ? "warn" : "bypass",
      quiet: !showWarnings,
    });

    if (apiDelay > 0) {
      console.log(`MSW API delay set to ${apiDelay}ms`);
    }

    console.log("MSW mocking enabled for development with unified handlers");
  }
}
