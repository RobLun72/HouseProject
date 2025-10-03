// src/shared/mocks/handlers/config.ts
import type { DatabaseQueries } from "../types";

// Database queries type - can be imported from either dev or test
export type DatabaseQueriesType = DatabaseQueries;

export interface HandlerConfig {
  // Environment configuration
  environment: "development" | "test";

  // API configuration
  houseApiBase: string;
  temperatureApiBase: string;
  expectedApiKey: string;

  // Database configuration
  databaseQueries: DatabaseQueriesType | (() => DatabaseQueriesType | null);
  requiresDatabaseCheck: boolean; // Whether to check if database is initialized

  // Logging configuration
  logPrefix: string; // e.g., "MSW" for dev, "MSW Test Handler" for test
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;

  // Delay configuration
  enableDelay: boolean;
}

export const createDevelopmentConfig = (
  getDatabaseQueries: () => DatabaseQueriesType | null
): HandlerConfig => ({
  environment: "development",
  houseApiBase: import.meta.env.VITE_HOUSE_API_URL || "https://localhost:7001",
  temperatureApiBase:
    import.meta.env.VITE_TEMPERATURE_API_URL || "https://localhost:7002",
  expectedApiKey: import.meta.env.VITE_TEMPERATURE_API_KEY || "test-api-key",
  databaseQueries: getDatabaseQueries,
  requiresDatabaseCheck: true,
  logPrefix: "MSW",
  enableRequestLogging: true,
  enableResponseLogging: true,
  enableDelay: true,
});

export const createTestConfig = (
  databaseQueries: DatabaseQueriesType
): HandlerConfig => ({
  environment: "test",
  houseApiBase: "https://localhost:7001",
  temperatureApiBase: "https://localhost:7002",
  expectedApiKey: "dev-key-123456789",
  databaseQueries,
  requiresDatabaseCheck: false,
  logPrefix: "MSW Test Handler",
  enableRequestLogging: false,
  enableResponseLogging: false,
  enableDelay: false, // No delays in test mode for fast execution
});
