// src/mocks/utils.ts
import { delay, HttpResponse } from "msw";

// Get the configured API delay from environment variables
const getApiDelay = () => {
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    return parseInt(import.meta.env.VITE_MSW_API_DELAY || "0", 10);
  }
  return 0;
};

// Apply delay if configured for development
export const applyDevDelay = async () => {
  const delayMs = getApiDelay();
  if (delayMs > 0) {
    await delay(delayMs);
  }
};

// Database initialization check utility
export const checkDatabaseInitialized = (
  DatabaseQueries: unknown
): Response | null => {
  if (!DatabaseQueries) {
    return HttpResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }
  return null;
};

// MSW request logging utility
export const logMswRequest = (requestType: string, requestPath: string) => {
  console.log(`🎯 MSW intercepted ${requestType} ${requestPath} request`);
};

export { getApiDelay };
