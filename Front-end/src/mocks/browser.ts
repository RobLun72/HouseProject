// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { developmentHandlers, initializeDatabaseQueries } from "./handlers";

// Environment variable configuration
const isMSWEnabled = import.meta.env.VITE_ENABLE_MSW_MOCKING === "true";
const apiDelay = parseInt(import.meta.env.VITE_MSW_API_DELAY || "0", 10);
const showWarnings = import.meta.env.VITE_MSW_WARN === "true";

// Setup worker for browser environment in development
export const developmentWorker = setupWorker(...developmentHandlers);

// Global delay function that handlers can use
export const getApiDelay = () => apiDelay;

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
    const { DatabaseQueries, setupBaseDataWithTemperatures } = await import(
      "./database"
    );

    // Seed the database with base data and temperatures
    setupBaseDataWithTemperatures();

    // Initialize the handlers with database queries
    initializeDatabaseQueries(DatabaseQueries);

    console.log("MSW database initialized with base data and temperatures");

    // Log the API URLs being intercepted
    console.log("MSW will intercept calls to:");
    console.log("- House API:", import.meta.env.VITE_HOUSE_API_URL);
    console.log("- Temperature API:", import.meta.env.VITE_TEMPERATURE_API_URL);

    // Start the worker with custom configuration
    await developmentWorker.start({
      onUnhandledRequest: showWarnings ? "warn" : "bypass",
      quiet: !showWarnings,
    });

    if (apiDelay > 0) {
      console.log(`MSW API delay set to ${apiDelay}ms`);
    }

    console.log("MSW mocking enabled for development with full database");
  }
}
