// src/shared/mocks/logging.ts
// Shared logging utilities for MSW handlers

export const createLogger = (prefix: string) => ({
  logRequest: (method: string, path: string) => {
    console.log(`🎯 ${prefix} intercepted ${method} ${path} request`);
  },

  logResponse: (message: string, ...args: unknown[]) => {
    console.log(`📦 ${prefix} ${message}`, ...args);
  },

  logError: (message: string, error: unknown) => {
    console.error(`❌ ${prefix} ${message}`, error);
  },

  logSuccess: (message: string, data?: unknown) => {
    console.log(`✅ ${prefix} ${message}`, data);
  },
});
