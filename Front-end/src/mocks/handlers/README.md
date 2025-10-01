# MSW Handlers Structure

This directory contains Mock Service Worker (MSW) handlers organized by feature area for better maintainability and separation of concerns.

## Structure

```
src/mocks/handlers/
├── index.ts              # Main export file - combines all handlers
├── shared.ts             # Shared configuration, constants, and utilities
├── houseHandlers.ts      # House-related API endpoints
├── roomHandlers.ts       # Room-related API endpoints
└── temperatureHandlers.ts # Temperature-related API endpoints
```

## Files Overview

### `index.ts`

- Exports all individual handler modules
- Provides a combined `developmentHandlers` array for backward compatibility
- Exports shared utilities like `initializeDatabaseQueries`

### `shared.ts`

- Contains API base URLs and configuration
- Database queries type definitions
- Database initialization utilities
- Shared constants like API keys

### `houseHandlers.ts`

- `GET /House` - Get all houses
- `GET /House/:houseId` - Get house by ID
- `POST /House` - Create new house
- `PUT /House/:houseId` - Update house
- `DELETE /House/:houseId` - Delete house

### `roomHandlers.ts`

- `GET /Room/house/:houseId` - Get rooms by house ID
- `GET /Room/:roomId` - Get room by ID
- `POST /Room` - Create new room
- `PUT /Room/:roomId` - Update room
- `DELETE /Room/:roomId` - Delete room

### `temperatureHandlers.ts`

- `GET /HousesWithRooms` - Get houses with their rooms
- `GET /Temperature/room/:roomId/dates` - Get available dates for room
- `GET /Temperature/room/:roomId/date/:date` - Get temperatures for room and date
- `POST /Temperature` - Create new temperature reading
- `PUT /Temperature/:tempId` - Update temperature reading
- `DELETE /Temperature/:tempId` - Delete temperature reading

## Usage

### Import all handlers (recommended)

```typescript
import { developmentHandlers } from "./handlers";
```

### Import specific handler groups

```typescript
import { houseHandlers, roomHandlers, temperatureHandlers } from "./handlers";
```

### Initialize database

```typescript
import { initializeDatabaseQueries } from "./handlers";
// Initialize with your database queries object
initializeDatabaseQueries(DatabaseQueries);
```

## Benefits

1. **Separation of Concerns**: Each file handles one specific domain
2. **Maintainability**: Easier to find and modify specific endpoints
3. **Scalability**: Easy to add new handler categories
4. **Testability**: Individual handler modules can be tested in isolation
5. **Backward Compatibility**: Existing imports continue to work unchanged
