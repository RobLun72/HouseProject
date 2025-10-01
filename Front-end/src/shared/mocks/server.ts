// src/shared/mocks/server.ts
import { setupServer } from "msw/node";
import { createHouseHandlers } from "./handlers/house";
import { createRoomHandlers } from "./handlers/room";
import { createTemperatureHandlers } from "./handlers/temperature";
import { createTestConfig } from "./handlers/config";
import { createDatabaseInstance } from "./database/index";

// Create test configuration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = createTestConfig(createDatabaseInstance() as any);

// Create all handlers
const handlers = [
  ...createHouseHandlers(config),
  ...createRoomHandlers(config),
  ...createTemperatureHandlers(config),
];

// Export server for test setup
export const server = setupServer(...handlers);
export { handlers };
