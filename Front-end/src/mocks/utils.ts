// src/mocks/utils.ts
import { delay } from "msw";

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

export { getApiDelay };
