// src/mocks/database/index.ts
// Browser-compatible exports of database functionality

// Re-export the database and queries in a way that works in the browser
export { db, resetIdCounters } from "../../test/mocks/database/db";
export { DatabaseQueries } from "../../test/mocks/database/queries";
export { setupBaseDataWithTemperatures } from "../../test/mocks/database/seeders";
