// src/mocks/handlers/shared.ts

// For development, we'll use the MSW database with proper seeding
// Import the database operations that work in browser context
// Use the same API URLs that the application is configured to use
export const HOUSE_API_BASE =
  import.meta.env.VITE_HOUSE_API_URL || "https://localhost:7001";
export const TEMPERATURE_API_BASE =
  import.meta.env.VITE_TEMPERATURE_API_URL || "https://localhost:7002";

// Use the same API key that the application is configured to use
export const EXPECTED_API_KEY =
  import.meta.env.VITE_TEMPERATURE_API_KEY || "test-api-key";

// Import the type for better typing
export type DatabaseQueriesType =
  typeof import("../../test/mocks/database/queries").DatabaseQueries;

// These will be populated by the database once it's initialized
let DatabaseQueries: DatabaseQueriesType | null = null;

// Initialize database queries - will be set up when MSW starts
export const initializeDatabaseQueries = (queries: DatabaseQueriesType) => {
  DatabaseQueries = queries;
};

// Export the database queries for use in handlers
export const getDatabaseQueries = () => DatabaseQueries;
