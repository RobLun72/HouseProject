// src/test/mocks/server.ts
import { setupServer } from "msw/node";
import { houseHandlers } from "./handlers/houseHandlers";
import { temperatureHandlers } from "./handlers/temperatureHandlers";

// Combine all handlers
export const handlers = [...houseHandlers, ...temperatureHandlers];

// Setup server with all handlers
export const server = setupServer(...handlers);
