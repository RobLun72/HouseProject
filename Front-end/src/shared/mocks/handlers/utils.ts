// src/shared/mocks/handlers/utils.ts
import { HttpResponse } from "msw";
import type { HandlerConfig } from "./config";
import type { DatabaseQueries } from "../types";

// Utility to get database queries with proper error handling
export const getDatabaseQueries = (
  config: HandlerConfig
): DatabaseQueries | null => {
  let db;
  if (typeof config.databaseQueries === "function") {
    db = config.databaseQueries();
  } else {
    db = config.databaseQueries;
  }

  return db;
};

// Utility to check database initialization
export const checkDatabaseInitialized = (
  config: HandlerConfig,
  databaseQueries: DatabaseQueries | null
): Response | null => {
  if (config.requiresDatabaseCheck && !databaseQueries) {
    return HttpResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }
  return null;
};

// Unified logging utility
export const logRequest = (
  config: HandlerConfig,
  method: string,
  path: string
) => {
  if (config.enableRequestLogging) {
    console.log(`🎯 ${config.logPrefix} intercepted ${method} ${path} request`);
  }
};

// Unified response logging utility
export const logResponse = (
  config: HandlerConfig,
  message: string,
  ...args: unknown[]
) => {
  if (config.enableResponseLogging) {
    console.log(`📦 ${config.logPrefix} ${message}`, ...args);
  }
};

// Apply delay based on configuration
export const applyConfiguredDelay = async (config: HandlerConfig) => {
  if (config.enableDelay) {
    // Import delay function from MSW
    const { delay } = await import("msw");

    // Use configured delay for development, default to 500ms
    const delayMs =
      config.environment === "development"
        ? parseInt(import.meta.env.VITE_MSW_API_DELAY || "500", 10)
        : 0;

    if (delayMs > 0) {
      await delay(delayMs);
    }
  }
};

// Check authentication via API key
export const checkAuth = (
  request: Request,
  config: HandlerConfig
): Response | null => {
  const apiKey = request.headers.get("X-Api-Key");

  if (!apiKey || apiKey !== config.expectedApiKey) {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
};
