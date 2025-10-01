// src/mocks/handlers/index.ts
import { houseHandlers } from "./houseHandlers";
import { roomHandlers } from "./roomHandlers";
import { temperatureHandlers } from "./temperatureHandlers";

// Export individual handler modules for flexibility
export { houseHandlers } from "./houseHandlers";
export { roomHandlers } from "./roomHandlers";
export { temperatureHandlers } from "./temperatureHandlers";

// Export shared utilities
export { initializeDatabaseQueries } from "./shared";
export type { DatabaseQueriesType } from "./shared";

// Combined handlers array for backward compatibility
export const developmentHandlers = [
  ...houseHandlers,
  ...roomHandlers,
  ...temperatureHandlers,
];
