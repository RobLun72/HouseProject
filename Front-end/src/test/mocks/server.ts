// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { houseHandlers } from "./handlers/houseHandlers";
import { temperatureHandlers } from "./handlers/temperatureHandlers";
import { roomHandlers } from "./handlers/roomHandlers";

// Combine all handlers
export const handlers = [
  ...houseHandlers,
  ...temperatureHandlers,
  ...roomHandlers,
];

// Setup server with all handlers
export const server = setupServer(...handlers);
