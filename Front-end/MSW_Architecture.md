# MSW (Mock Service Worker) Architecture

## Overview

This document describes the architecture and implementation of Mock Service Worker (MSW) in the HouseProject frontend application. MSW is used for both development mocking and comprehensive testing, providing a unified approach to API simulation that works seamlessly across different environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Environment Configurations](#environment-configurations)
- [Database Layer](#database-layer)
- [Handler System](#handler-system)
- [Development Mode](#development-mode)
- [Testing Mode](#testing-mode)
- [Configuration Management](#configuration-management)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

The MSW implementation follows a modular, environment-aware architecture that supports both browser-based development mocking and Node.js-based test execution. The system is designed with clear separation of concerns and robust configuration management.

```
┌──────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├──────────────────────────────────────────────────────────────┤
│  Development Mode        │         Test Mode                 │
│  ┌─────────────────────┐ │ ┌─────────────────────────────┐   │
│  │   Browser Worker    │ │ │      Node.js Server         │   │
│  │   (Service Worker)  │ │ │   (setupServer from MSW)    │   │
│  └─────────────────────┘ │ └─────────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│                    Handler Layer                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  House Handlers │ Room Handlers │ Temperature Handlers  │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                   Configuration Layer                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │     Development Config     │      Test Config           │ │
│  │  - API URLs from env vars  │  - Fixed test URLs         │ │
│  │  - Request/Response logs   │  - Minimal logging         │ │
│  │  - Configurable delays     │  - Zero delays (fast)      │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                     Database Layer                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         In-Memory Database (@mswjs/data)                │ │
│  │  ┌─────────────┬─────────────┬─────────────────────┐    │ │
│  │  │   Houses    │    Rooms    │   Temperatures      │    │ │
│  │  │   Model     │    Model    │     Model           │    │ │
│  │  └─────────────┴─────────────┴─────────────────────┘    │ │
│  │                 Unified Query Interface                 │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Entry Points

#### Development Entry (`src/main.tsx`)

```typescript
// Enable MSW in development mode if configured
async function enableMocking() {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_MSW_MOCKING === "true"
  ) {
    const { enableMSW } = await import("./shared/mocks/browser");
    return enableMSW();
  }
}
```

#### Test Entry (`src/test/setup.ts`)

```typescript
import { server } from "../shared/mocks/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});
```

### 2. Browser vs Node.js Implementation

**Browser Implementation** (`src/shared/mocks/browser.ts`):

- Uses `setupWorker` from `msw/browser`
- Runs as a Service Worker in the browser
- Intercepts network requests transparently
- Supports hot reloading and development workflows

**Node.js Implementation** (`src/shared/mocks/server.ts`):

- Uses `setupServer` from `msw/node`
- Runs in Node.js environment for testing
- Provides deterministic, isolated test execution
- Optimized for fast test performance

## Environment Configurations

### Development Environment (`.env.local`)

```bash
# MSW Mock Configuration for Development
VITE_ENABLE_MSW_MOCKING=true
VITE_MSW_API_DELAY=500
VITE_MSW_WARN=false
```

### Test Environment Configuration

Test environment variables are configured directly in `src/test/setup.ts`:

```typescript
// Mock environment variables
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_TEMPERATURE_API_URL: "https://localhost:7002",
    VITE_TEMPERATURE_API_KEY: "dev-key-123456789",
    VITE_HOUSE_API_URL: "https://localhost:7001",
    VITE_HOUSE_API_KEY: "dev-key-123456789",
  },
  writable: true,
});
```

> **Note**: No `.env.test` file is needed. All test configuration is handled in code for better maintainability and clearer dependency management.

### Configuration Approach

Test configuration follows a **code-over-files** approach:

1. **Environment Variables**: Set directly in `src/test/setup.ts` using `Object.defineProperty`
2. **MSW Configuration**: Controlled via `enableDelay: false` in test config
3. **No External Files**: No `.env.test` or other environment files needed

## Database Layer

### In-Memory Database Architecture

The MSW implementation uses `@mswjs/data` to create a sophisticated in-memory database that provides:

- **Relational Data Modeling**: Houses, Rooms, and Temperatures with proper relationships
- **Query Interface**: Unified API for CRUD operations
- **State Management**: Persistent state during development, isolated state during testing
- **Seeding Capabilities**: Pre-populated data for realistic scenarios

### Database Models

```typescript
// Houses Model
const houseModel = {
  id: () => generateId(),
  name: String,
  address: String,
  description: String,
  imageUrl: String,
  createdAt: () => new Date().toISOString(),
  updatedAt: () => new Date().toISOString(),
};

// Rooms Model
const roomModel = {
  id: () => generateId(),
  houseId: Number,
  name: String,
  description: String,
  createdAt: () => new Date().toISOString(),
  updatedAt: () => new Date().toISOString(),
};

// Temperatures Model
const temperatureModel = {
  id: () => generateId(),
  roomId: Number,
  temperature: Number,
  humidity: Number,
  timestamp: String,
  createdAt: () => new Date().toISOString(),
};
```

### Query Interface

The database provides a unified query interface (`DatabaseQueries`) that abstracts the underlying data operations:

```typescript
export const DatabaseQueries = {
  // House operations
  getAllHouses: () => db.house.findMany({}),
  getHouseById: (id: number) => db.house.findFirst({ where: { id: { equals: id } } }),
  createHouse: (data: CreateHouseData) => db.house.create(data),
  updateHouse: (id: number, data: UpdateHouseData) => db.house.update({ where: { id: { equals: id } }, data }),
  deleteHouse: (id: number) => db.house.delete({ where: { id: { equals: id } } }),

  // Room operations
  getRoomsByHouseId: (houseId: number) => db.room.findMany({ where: { houseId: { equals: houseId } } }),
  getRoomById: (id: number) => db.room.findFirst({ where: { id: { equals: id } } }),
  // ... additional room operations

  // Temperature operations
  getTemperaturesByRoomAndDate: (roomId: number, date: string) => /* complex query logic */,
  createTemperature: (data: CreateTemperatureData) => db.temperature.create(data),
  // ... additional temperature operations
};
```

## Handler System

### Handler Architecture

Each API domain (Houses, Rooms, Temperatures) has dedicated handlers that:

1. **Validate Requests**: Check authentication, parameters, and request format
2. **Process Business Logic**: Handle CRUD operations with proper validation
3. **Manage Response Format**: Return consistent API responses
4. **Handle Errors**: Provide meaningful error messages and HTTP status codes

### Handler Configuration System

```typescript
interface HandlerConfig {
  environment: "development" | "test";
  houseApiBase: string;
  temperatureApiBase: string;
  expectedApiKey: string;
  databaseQueries: DatabaseQueriesType | (() => DatabaseQueriesType | null);
  requiresDatabaseCheck: boolean;
  logPrefix: string;
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
  enableDelay: boolean;
}
```

### Request/Response Flow

```typescript
// Example House Handler
export const createHouseHandlers = (config: HandlerConfig) => [
  http.get(`${config.houseApiBase}/api/houses`, async ({ request }) => {
    // 1. Authentication Check
    const authResult = checkAuthentication(request, config);
    if (!authResult.isValid) {
      return HttpResponse.json(
        { message: authResult.message },
        { status: 401 }
      );
    }

    // 2. Database Query
    const db = getDatabaseQueries(config);
    const houses = db.getAllHouses();

    // 3. Response with Delay (if configured)
    await applyConfiguredDelay(config);

    // 4. Logging (if enabled)
    logResponse(config, "GET /api/houses", houses.length);

    return HttpResponse.json(houses);
  }),
  // ... additional handlers
];
```

## Development Mode

### Initialization Sequence

1. **Environment Check**: Verify `VITE_ENABLE_MSW_MOCKING=true`
2. **Database Seeding**: Populate with realistic test data
3. **Handler Registration**: Register all API handlers
4. **Service Worker Start**: Initialize browser service worker
5. **Request Interception**: Begin intercepting API calls

### Development Features

- **Request Logging**: See all intercepted API calls in console
- **Response Delays**: Simulate real network latency (500ms default)
- **Data Persistence**: Maintains data state during development session
- **Hot Reloading**: Seamlessly works with Vite's hot reload
- **Visual Indicators**: Console messages confirm MSW activation

### Browser DevTools Integration

MSW provides excellent DevTools integration:

- Network tab shows intercepted requests
- Service Worker registration visible in Application tab
- Console logging for debugging

## Testing Mode

### Test Environment Optimization

- **Zero Delays**: `enableDelay: false` in test config for fast test execution
- **Isolated State**: Each test gets a clean database state
- **Deterministic**: Consistent behavior across test runs
- **Comprehensive Coverage**: All API endpoints mocked

### Test Lifecycle Management

```typescript
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
  DatabaseTestHelpers.clearDatabase();
});

beforeEach(() => {
  DatabaseTestHelpers.clearDatabase();
  document.body.innerHTML = "";
});

afterEach(() => {
  server.resetHandlers();
  DatabaseTestHelpers.clearDatabase();
  document.body.innerHTML = "";
});

afterAll(() => server.close());
```

### Test Data Management

**Database Helpers** provide utilities for test data management:

```typescript
export const DatabaseTestHelpers = {
  clearDatabase: () => {
    // Clear all data in dependency order (children first, then parents)
    db.temperature.deleteMany({ where: {} });
    db.auditLog.deleteMany({ where: {} });
    db.room.deleteMany({ where: {} });
    db.house.deleteMany({ where: {} });
    db.user.deleteMany({ where: {} });
    resetIdCounters();
  },

  seedTestData: (scenario: TestScenario) => {
    // Create specific test data scenarios
  },
};
```

## Configuration Management

### Environment-Specific Configurations

**Development Configuration**:

```typescript
export const createDevelopmentConfig = (
  getDatabaseQueries: () => DatabaseQueriesType | null
): HandlerConfig => ({
  environment: "development",
  houseApiBase: import.meta.env.VITE_HOUSE_API_URL || "https://localhost:7001",
  temperatureApiBase:
    import.meta.env.VITE_TEMPERATURE_API_URL || "https://localhost:7002",
  expectedApiKey: import.meta.env.VITE_TEMPERATURE_API_KEY || "test-api-key",
  databaseQueries: getDatabaseQueries,
  requiresDatabaseCheck: true,
  logPrefix: "MSW",
  enableRequestLogging: true,
  enableResponseLogging: true,
  enableDelay: true,
});
```

**Test Configuration**:

```typescript
export const createTestConfig = (
  databaseQueries: DatabaseQueriesType
): HandlerConfig => ({
  environment: "test",
  houseApiBase: "https://localhost:7001",
  temperatureApiBase: "https://localhost:7002",
  expectedApiKey: "dev-key-123456789",
  databaseQueries,
  requiresDatabaseCheck: false,
  logPrefix: "MSW Test Handler",
  enableRequestLogging: false,
  enableResponseLogging: false,
  enableDelay: false, // No delays in test mode for fast execution
});
```

### Package.json Scripts

MSW-aware test scripts with experimental warning suppression:

```json
{
  "scripts": {
    "test": "cross-env NODE_OPTIONS=\"--disable-warning=ExperimentalWarning\" vitest --mode test",
    "test:run": "cross-env NODE_OPTIONS=\"--disable-warning=ExperimentalWarning\" vitest run --mode test",
    "test:coverage": "cross-env NODE_OPTIONS=\"--disable-warning=ExperimentalWarning\" vitest run --coverage --mode test"
  }
}
```

## Performance Considerations

### Development Performance

- **Lazy Loading**: MSW modules loaded only when needed
- **Efficient Serialization**: Optimized JSON responses
- **Configurable Delays**: Realistic but not excessive response times
- **Memory Management**: Proper cleanup of handlers and listeners

### Test Performance

- **Zero Network Latency**: Immediate responses in test mode
- **Minimal Logging**: Reduced console output during tests
- **Efficient State Reset**: Fast database cleanup between tests
- **Parallel Execution**: Supports Vitest's parallel test execution

### Memory Usage

- **In-Memory Database**: Efficient storage with automatic cleanup
- **Handler Caching**: Reuse of compiled handlers
- **State Isolation**: Prevents memory leaks between tests

## Best Practices

### 1. Handler Organization

- **Domain Separation**: Separate handlers by API domain (Houses, Rooms, Temperatures)
- **Consistent Patterns**: Use similar patterns across all handlers
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Authentication**: Consistent API key validation across all handlers

### 2. Database Management

- **Clean State**: Always start tests with clean database state
- **Realistic Data**: Use meaningful test data that reflects real usage
- **Relationship Integrity**: Maintain proper relationships between entities
- **ID Management**: Consistent ID generation and management

### 3. Configuration Management

- **Environment Variables**: Use env vars for all configurable aspects
- **Type Safety**: Strong typing for configuration objects
- **Validation**: Validate configuration at startup
- **Documentation**: Clear documentation of all configuration options

### 4. Testing Strategies

- **Integration Tests**: Test complete user workflows with MSW
- **Unit Tests**: Test individual components with mocked API responses
- **Error Scenarios**: Test error conditions and edge cases
- **Performance Tests**: Verify test suite runs efficiently

## Troubleshooting

### Common Issues

**1. MSW Not Intercepting Requests**

```bash
# Check environment variables
VITE_ENABLE_MSW_MOCKING=true

# Verify service worker registration
# Check browser DevTools > Application > Service Workers
```

**2. Database State Issues**

```typescript
// Clear database state in tests
beforeEach(() => {
  DatabaseTestHelpers.clearDatabase();
});
```

**3. CORS or Network Errors**

```typescript
// Ensure proper handler registration
const handlers = [
  ...createHouseHandlers(config),
  ...createRoomHandlers(config),
  ...createTemperatureHandlers(config),
];
```

**4. Performance Issues**

```typescript
// Check delay configuration in config files
// Test config: enableDelay: false (fast execution)
// Development config: enableDelay: true (realistic delays)
```

### Debugging Tools

**1. Console Logging**

```typescript
// Enable detailed logging in development
const config = createDevelopmentConfig(getDatabaseQueries);
config.enableRequestLogging = true;
config.enableResponseLogging = true;
```

**2. Network Tab**

- Check intercepted requests in browser DevTools
- Verify response payloads and status codes
- Monitor request timing and delays

**3. Test Debugging**

```typescript
// Add debugging to specific tests
it("should handle API calls", async () => {
  // Log database state
  console.log("Database houses:", DatabaseQueries.getAllHouses());

  // Your test code here
});
```

### Performance Monitoring

**1. Test Execution Time**

```bash
# Monitor test performance
npm run test:run -- --reporter=verbose
```

**2. Memory Usage**

```bash
# Check for memory leaks in long test runs
npm run test:run -- --no-coverage --reporter=verbose
```

**3. Handler Performance**

```typescript
// Add timing to handlers
const startTime = performance.now();
// Handler logic
const endTime = performance.now();
console.log(`Handler execution time: ${endTime - startTime}ms`);
```

## Dependencies

### Core MSW Dependencies

- `msw@^2.11.3` - Core MSW library
- `@mswjs/data@^0.16.2` - In-memory database

### Supporting Dependencies

- `cross-env@^10.1.0` - Cross-platform environment variables
- `@faker-js/faker@^9.9.0` - Realistic test data generation

### Environment Integration

- `vite@^7.0.3` - Build tool with environment variable support
- `vitest@^3.2.4` - Test runner with MSW integration

## Version Compatibility

- **MSW v2.x**: Current implementation uses MSW v2 with modern APIs
- **Node.js 20+**: Required for optimal performance and compatibility
- **Vite 7.x**: Integrated with Vite's development server
- **React 18.x**: Compatible with React's concurrent features

---

This architecture provides a robust, maintainable, and performant solution for API mocking that serves both development and testing needs effectively. The unified approach ensures consistency across environments while optimizing for each specific use case.
