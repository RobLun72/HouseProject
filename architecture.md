# HouseProject Architecture Documentation

## Overview

HouseProject is a microservices-based application for managing houses, rooms, and temperature data. The system follows Domain-Driven Design (DDD) principles with event-driven communication between services.

### Architecture Components

- **Frontend**: React + TypeScript + Tailwind CSS + ShadCN UI (Containerized with Docker)
- **Backend**: ASP.NET Core Web APIs (HouseService, TemperatureService)
- **Database**: PostgreSQL with Entity Framework Core
- **Infrastructure**: Docker, Docker Compose, Multi-stage builds
- **Testing**:
  - **Backend**: xUnit with comprehensive unit and integration tests
  - **Frontend**: Vitest + React Testing Library + MSW (Mock Service Worker)
- **Security**: API Key Authentication, CORS support, Distroless containers

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Client Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  React Frontend  │  Swagger UI (Dev)  │  External APIs  │  Monitoring Tools │
│  (Containerized) │                    │                 │                   │
└─────────────────────────────────────────────────────────────────────────────┘
                │                       │
          CORS-Enabled            HTTPS/API Keys
          API Calls                     │
                │                       │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Application Layer                                │
├──────────────┬──────────────────────┬───────────────────────────────────────┤
│   Frontend   │      HouseService    │         TemperatureService            │
│   Container  │                      │                                       │
│              │  • House Management  │  • Temperature Data                   │
│  • React SPA │  • Room Management   │  • House/Room Synchronization         │
│  • TypeScript│  • Event Publishing  │  • Event Consumption                  │
│  • Tailwind  │  • API Key Auth      │  • API Key Authentication             │
│  • ShadCN UI │  • CORS Support      │  • CORS Support                       │
│  • Vite      │  • Streamlined APIs  │  • Streamlined APIs                   │
└──────────────┴──────────────────────┴───────────────────────────────────────┘
                          │                                       │
                          └─────────────┐         ┌───────────────┘
                                        │         │
                                  Event Publishing/Consumption
                                        │         │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Message Bus Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  RabbitMQ (Local) / Azure Service Bus (Cloud)                               │
│  • House Events: Created, Updated, Deleted                                  │
│  • Room Events: Created, Updated, Deleted                                   │
│  • Async Communication                                                      │
│  • Event Sourcing Pattern                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Data Layer                                         │
├───────────────────────────────┬─────────────────────────────────────────────┤
│        House Database         │      Temperature Database                   │
│                               │                                             │
│  PostgreSQL                   │  PostgreSQL                                 │
│  • Houses                     │  • Houses (Read-only replicas)              │
│  • Rooms                      │  • Rooms (Read-only replicas)               │
│  • EF Core Migrations         │  • Temperatures                             │
│  • OutboxEvents               │  • EF Core Migrations                       │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

## Service Details

### 1. HouseService

**Responsibilities:**

- Primary owner of House and Room entities
- CRUD operations for houses and rooms
- Publishing domain events when data changes
- API endpoint provider for external systems

**Technology Stack:**

- ASP.NET Core 8.0
- Entity Framework Core
- PostgreSQL
- MassTransit (Event Publishing)
- Swagger/OpenAPI

**Endpoints:**

```
GET    /api/houses              # List all houses
GET    /api/houses/{id}         # Get house by ID
POST   /api/houses              # Create new house
PUT    /api/houses/{id}         # Update house
DELETE /api/houses/{id}         # Delete house

GET    /api/rooms               # List all rooms
GET    /api/rooms/{id}          # Get room by ID
GET    /api/rooms/house/{houseId} # Get rooms by house
POST   /api/rooms               # Create new room
PUT    /api/rooms/{id}          # Update room
DELETE /api/rooms/{id}          # Delete room
```

**Database Schema:**

```sql
Houses:
- Id (PK)
- Name
- Address
- Area
- CreatedAt
- UpdatedAt

Rooms:
- Id (PK)
- HouseId (FK)
- Name
- Type
- Area
- CreatedAt
- UpdatedAt
```

### 2. TemperatureService

**Responsibilities:**

- Managing temperature data for rooms
- Maintaining read-only replicas of House/Room data
- Consuming events from HouseService to stay synchronized
- Temperature data analytics and reporting

**Technology Stack:**

- ASP.NET Core 8.0
- Entity Framework Core
- PostgreSQL
- MassTransit (Event Consumption)
- Swagger/OpenAPI

**Endpoints:**

```
GET    /api/temperatures                    # List temperature readings
GET    /api/temperatures/{id}               # Get temperature by ID
GET    /api/temperatures/room/{roomId}      # Get temperatures for room
GET    /api/temperatures/house/{houseId}    # Get temperatures for house
POST   /api/temperatures                    # Record new temperature
PUT    /api/temperatures/{id}               # Update temperature reading
DELETE /api/temperatures/{id}               # Delete temperature reading

# Synchronization endpoints
GET    /api/sync/houses                     # Get synchronized houses
GET    /api/sync/rooms                      # Get synchronized rooms
POST   /api/sync/house                      # Manual house sync
POST   /api/sync/room                       # Manual room sync
```

**Database Schema:**

```sql
Houses: (Read-only replicas)
- Id (PK)
- Name
- Address
- Area
- LastSyncedAt

Rooms: (Read-only replicas)
- Id (PK)
- HouseId (FK)
- Name
- Type
- Area
- LastSyncedAt

Temperatures:
- Id (PK)
- RoomId (FK)
- Value
- Unit (Celsius/Fahrenheit)
- RecordedAt
- CreatedAt
- UpdatedAt
```

## Communication Patterns

### 1. Event-Driven Communication

**Message Flow:**

```
HouseService                    Message Bus                    TemperatureService
     │                               │                               │
     ├─ Create House ──────────────► │ ──────── HouseCreated ──────► │
     │                               │                               ├─ Create House Replica
     │                               │                               │
     ├─ Update House ──────────────► │ ──────── HouseUpdated ──────► │
     │                               │                               ├─ Update House Replica
     │                               │                               │
     ├─ Delete House ──────────────► │ ──────── HouseDeleted ──────► │
     │                               │                               ├─ Delete House + Temps
     │                               │                               │
     ├─ Create Room ───────────────► │ ──────── RoomCreated ───────► │
     │                               │                               ├─ Create Room Replica
     │                               │                               │
     ├─ Update Room ───────────────► │ ──────── RoomUpdated ───────► │
     │                               │                               ├─ Update Room Replica
     │                               │                               │
     ├─ Delete Room ───────────────► │ ──────── RoomDeleted ───────► │
                                     │                               ├─ Delete Room + Temps
```

**Event Types:**

1. **House Events:**

   - `HouseCreated`: New house added
   - `HouseUpdated`: House details modified
   - `HouseDeleted`: House removed

2. **Room Events:**
   - `RoomCreated`: New room added to house
   - `RoomUpdated`: Room details modified
   - `RoomDeleted`: Room removed from house

### 2. Message Contracts

**Shared Event Interfaces:**

```csharp
// House Events
public interface IHouseCreated : IHouseEvent
{
    string Name { get; }
    string Address { get; }
    decimal Area { get; }
}

public interface IHouseUpdated : IHouseEvent
{
    string Name { get; }
    string Address { get; }
    decimal Area { get; }
}

public interface IHouseDeleted : IHouseEvent { }

// Room Events
public interface IRoomCreated : IRoomEvent
{
    string Name { get; }
    string Type { get; }
    decimal Area { get; }
}

public interface IRoomUpdated : IRoomEvent
{
    string Name { get; }
    string Type { get; }
    decimal Area { get; }
}

public interface IRoomDeleted : IRoomEvent { }
```

### 3. Event Consumers

**TemperatureService Consumers:**

```csharp
// House Event Consumers
public class HouseCreatedConsumer : IConsumer<IHouseCreated>
public class HouseUpdatedConsumer : IConsumer<IHouseUpdated>
public class HouseDeletedConsumer : IConsumer<IHouseDeleted>

// Room Event Consumers
public class RoomCreatedConsumer : IConsumer<IRoomCreated>
public class RoomUpdatedConsumer : IConsumer<IRoomUpdated>
public class RoomDeletedConsumer : IConsumer<IRoomDeleted>
```

## Frontend Architecture

### 3. Frontend Service

**Responsibilities:**

- React-based Single Page Application (SPA)
- User interface for house and temperature management
- Real-time data visualization and interaction
- Responsive design for multiple device types

**Technology Stack:**

- React 18 with TypeScript
- Vite build system
- Tailwind CSS for styling
- ShadCN UI component library
- Docker containerization with multi-stage builds

**Container Architecture:**

```dockerfile
# Multi-stage Docker build for maximum security and efficiency

Development Stage:
- Base: node:20-slim (minimal CVEs, full toolchain)
- Features: Hot reload, development tools, Vite dev server
- Port: 3000
- User: Non-root frontend user

Build Stage:
- Base: node:20-slim (build tools available)
- Purpose: Compile TypeScript, bundle assets, optimize for production
- Output: Static files in /dist

Production Stage:
- Base: gcr.io/distroless/nodejs20-debian12:nonroot (ZERO CVEs)
- Features: Custom Node.js static file server
- Security: No OS packages, minimal attack surface
- User: nonroot (built-in distroless user)
- Port: 3000
```

**API Integration:**

```typescript
// Environment-based API configuration
const API_CONFIG = {
  houseService: {
    baseUrl: import.meta.env.VITE_HOUSE_API_URL,
    apiKey: import.meta.env.VITE_HOUSE_API_KEY,
  },
  temperatureService: {
    baseUrl: import.meta.env.VITE_TEMPERATURE_API_URL,
    apiKey: import.meta.env.VITE_TEMPERATURE_API_KEY,
  },
};

// CORS-enabled API calls
const apiCall = async (url: string, options: RequestInit) => {
  return fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": API_CONFIG.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};
```

**Key Features:**

- **State Management**: Consolidated React state with atomic updates
- **Component Architecture**: Modular components with clear separation of concerns
- **Routing**: React Router for SPA navigation
- **API Communication**: Custom hooks for service integration
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Security Headers**: CSP, CORS, and other security headers implemented

## Security Architecture

### Authentication & Authorization

- **API Key Authentication**: Both services require API keys for access
  - Custom `ApiKeyAuthAttribute` with CORS preflight support
  - Environment-specific keys for dev/staging/production
  - Header-based authentication: `X-Api-Key`
- **HTTPS Only**: All communication is encrypted in transit
- **CORS Support**: Configured origins for frontend integration

### Container Security

- **Production**: Google Distroless images (zero CVE vulnerabilities)
  - `gcr.io/distroless/nodejs20-debian12:nonroot` for frontend
  - No OS packages, shells, or package managers
  - Built-in non-root user execution
- **Development/Build**: Debian slim images (minimal CVEs)
  - Security updates applied during build
  - Non-root user creation and execution
  - Clean package cache and temporary files
- **Multi-stage Builds**: Development tools isolated from production

### Network Security

- **Container Networks**: Isolated Docker networks for service groups
  - `house-network`: HouseService ↔ House PostgreSQL
  - `temperature-network`: TemperatureService ↔ Temperature PostgreSQL
  - `messaging-network`: Both Services ↔ RabbitMQ
- **Database Isolation**: Separate PostgreSQL instances per service
- **Message Bus Security**: Authenticated RabbitMQ/Service Bus access
- **CORS Configuration**: Strict origin validation for frontend access

### Application Security

- **Security Headers**: Implemented in frontend static server
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy`: Restrictive policy
- **Input Validation**: API model validation and sanitization
- **Error Handling**: Secure error responses without sensitive data exposure

## Deployment Architecture

### Local Development (Docker Compose)

```
Networks:
├─ house-network (HouseService ↔ House PostgreSQL ↔ Frontend)
├─ temperature-network (TemperatureService ↔ Temperature PostgreSQL ↔ Frontend)
└─ messaging-network (Both Services ↔ RabbitMQ)

Ports:
├─ 3000: Frontend (React/Vite Development Server)
├─ 7001: HouseService HTTPS
├─ 7002: TemperatureService HTTPS
├─ 5434: House PostgreSQL
├─ 5433: Temperature PostgreSQL
├─ 5672: RabbitMQ AMQP
└─ 15672: RabbitMQ Management UI

Container Configuration:
├─ Frontend: Multi-stage Dockerfile (Development target)
│  ├─ Base: node:20-slim with security updates
│  ├─ Volume mounts for hot reload
│  ├─ Environment variables for API endpoints
│  └─ Health checks for container orchestration
│
├─ Backend Services: .NET 8 with multi-stage builds
│  ├─ Development/Production dockerfile targets
│  ├─ HTTPS certificates via volume mounts
│  └─ CORS configured for frontend origin
```

### Azure Container Apps (Production)

```
Azure Container Apps Environment
├─ Frontend Container App
│  ├─ Google Distroless container (zero CVEs)
│  ├─ Custom Node.js static file server
│  ├─ Auto-scaling (1-5 replicas)
│  ├─ HTTPS Ingress with custom domain
│  └─ Environment Variables from Key Vault
│
├─ HouseService Container App
│  ├─ Auto-scaling (1-10 replicas)
│  ├─ HTTPS Ingress
│  └─ Environment Variables from Key Vault
│
├─ TemperatureService Container App
│  ├─ Auto-scaling (1-10 replicas)
│  ├─ HTTPS Ingress
│  └─ Environment Variables from Key Vault
│
Azure Resources:
├─ PostgreSQL Flexible Servers (2x)
├─ Azure Service Bus (Message Broker)
├─ Azure Container Registry (Multi-arch images)
├─ Azure Key Vault (Secrets & API Keys)
├─ Application Insights (Monitoring)
├─ Log Analytics Workspace
└─ Azure Front Door (CDN & WAF for Frontend)
```

## API Architecture & Testing Strategy

### Streamlined API Endpoints

Following Agent.md patterns, the APIs have been refactored for clarity and efficiency:

**HouseService - Simplified Endpoints:**

```
GET    /api/houses              # List all houses with rooms
GET    /api/houses/{id}         # Get house by ID with rooms
POST   /api/houses              # Create new house
PUT    /api/houses/{id}         # Update house
DELETE /api/houses/{id}         # Delete house (cascades to rooms)

GET    /api/rooms               # List all rooms
GET    /api/rooms/{id}          # Get room by ID
POST   /api/rooms               # Create new room
PUT    /api/rooms/{id}          # Update room
DELETE /api/rooms/{id}          # Delete room

GET    /health                  # Health check endpoint
```

**TemperatureService - Streamlined Endpoints:**

```
GET    /api/temperatures/room/{roomId}/dates/{date}  # Get temperatures by room and specific date
GET    /api/temperatures/room/{roomId}/available-dates  # Get available dates for room
GET    /api/temperatures/{id}                        # Get temperature by ID
POST   /api/temperatures                             # Record new temperature
PUT    /api/temperatures/{id}                        # Update temperature
DELETE /api/temperatures/{id}                        # Delete temperature

GET    /api/houses                                   # Get houses with rooms (synchronized)
GET    /health                                       # Health check endpoint
```

### Comprehensive Testing Strategy

**Unit Tests (xUnit Framework):**

- **HouseService**: 9 comprehensive tests covering all controller methods
- **TemperatureService**: 17 focused tests for streamlined API endpoints
- **Coverage**: All CRUD operations, edge cases, and error handling
- **Mocking**: Entity Framework contexts and dependencies mocked
- **Assertions**: Response codes, data validation, business logic verification

**Test Organization:**

```csharp
// Example test structure
[Test]
public async Task GetTemperaturesByRoomAndDate_ValidData_ReturnsTemperatures()
{
    // Arrange: Setup mock data and expected results
    // Act: Call controller method
    // Assert: Verify response and data integrity
}
```

**Integration Tests:**

- Planned for cross-service communication testing
- Event publishing/consumption validation
- End-to-end API workflow testing

## Data Consistency Patterns

### 1. Eventual Consistency

- TemperatureService maintains eventually consistent replicas
- Event-driven synchronization ensures data alignment
- Retry mechanisms handle temporary failures

### 2. Data Ownership

- **HouseService**: Single source of truth for Houses and Rooms
- **TemperatureService**: Owns Temperature data, replicates House/Room data

### 3. Conflict Resolution

- Events include timestamps for ordering
- Last-write-wins strategy for updates
- Deleted entities cascade to related data

## Monitoring & Observability

### Application Insights Integration

- **Request Tracking**: HTTP request/response monitoring
- **Dependency Tracking**: Database and message bus calls
- **Custom Telemetry**: Business-specific metrics
- **Exception Tracking**: Error monitoring and alerting

### Health Checks

- Database connectivity checks
- Message bus health verification
- Custom business logic health indicators

### Logging Strategy

- **Structured Logging**: JSON-formatted logs
- **Correlation IDs**: Request tracing across services
- **Log Levels**: Debug, Info, Warning, Error, Critical
- **Centralized Logging**: Azure Log Analytics

## Performance Considerations

### Scalability

- **Horizontal Scaling**: Container replicas scale based on load
- **Database Scaling**: Read replicas for read-heavy operations
- **Message Bus**: Partitioned topics for high throughput

### Caching Strategy

- **Entity Framework**: Second-level caching for read operations
- **Application Cache**: In-memory caching for frequently accessed data
- **CDN**: Static content delivery (when applicable)

### Async Processing

- **Event Publishing**: Non-blocking event dispatch
- **Background Services**: Async data processing
- **Bulk Operations**: Batch processing for large datasets

### Container Optimization

- **Multi-stage Builds**: Separate development, build, and production stages
- **Distroless Production**: Minimal container size and attack surface
- **Layer Caching**: Optimized Docker layer ordering for faster builds
- **Security Updates**: Automated security patching in non-production stages

## Testing Strategy

### Backend Testing (Implemented)

#### Unit Tests

- **HouseService Tests**: 9 comprehensive tests covering all controller endpoints
  - CRUD operations validation
  - Error handling and edge cases
  - Entity Framework mock integration
- **TemperatureService Tests**: 17 focused tests for streamlined API
  - Date-based temperature queries
  - Room and house data validation
  - Synchronized house/room endpoint testing
- **Test Framework**: xUnit with comprehensive assertions and mocking

#### Integration Tests (Planned)

- **End-to-End**: Full request/response cycles with containerized services
- **Database Integration**: Real database operations
- **Message Bus**: Event publishing/consumption testing

### Frontend Testing (Implemented)

#### Test Framework & Tools

- **Vitest**: Fast, modern test runner with native ESM support
- **React Testing Library**: Component testing with user-centric queries
- **MSW (Mock Service Worker)**: API mocking for both development and testing
- **jsdom**: Simulated browser environment for Node.js tests
- **Coverage**: Vitest coverage-v8 for comprehensive test coverage reporting

#### Testing Architecture

**MSW-Based API Mocking**:

```typescript
// Unified mocking approach for development and testing
Development Mode:
- MSW Service Worker (browser-based)
- Request/response logging enabled
- Configurable delays (500ms default)
- Persistent in-memory database state

Test Mode:
- MSW Node.js server
- Zero delays for fast execution
- Isolated database state per test
- Minimal logging for clean output
```

**In-Memory Database** (`@mswjs/data`):

- Full relational data modeling (Houses, Rooms, Temperatures)
- Unified query interface for CRUD operations
- Automatic cleanup between tests
- Realistic test data seeding with `@faker-js/faker`

#### Test Coverage Areas

**Component Tests**:

- React component rendering and behavior
- User interactions (clicks, form inputs, navigation)
- State management and data flow
- Error boundaries and fallback UI
- Responsive design validation

**Integration Tests**:

- Complete user workflows (create, read, update, delete)
- Multi-component interactions
- API call sequences and error handling
- Navigation and routing flows
- Authentication and authorization

**Database Integration Tests**:

- CRUD operations through MSW handlers
- Data relationships (Houses ↔ Rooms ↔ Temperatures)
- Query filtering and pagination
- Cascading deletes and referential integrity

**Environment Tests**:

- Environment variable configuration
- API endpoint validation
- Authentication token handling
- CORS and security headers

#### Test Configuration

**Vitest Setup** (`vitest.config.ts`):

```typescript
{
  environment: "jsdom",           // Browser-like environment
  setupFiles: ["./src/test/setup.ts"],
  css: true,                      // Process CSS imports
  globals: true,                  // Global test APIs
  pool: "forks",                  // Isolated test execution
  coverage: {
    provider: "v8",
    reporter: ["text", "html", "lcov"],
    exclude: ["node_modules/", "src/test/", "**/*.d.ts"]
  }
}
```

**Test Lifecycle Management**:

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
});

afterAll(() => server.close());
```

#### Test Scripts

```json
{
  "test": "vitest", // Watch mode for TDD
  "test:run": "vitest run", // Single run
  "test:coverage": "vitest run --coverage", // Coverage report
  "test:ui": "vitest --ui", // Visual test UI
  "test:watch": "vitest --watch" // Continuous testing
}
```

#### Testing Best Practices

1. **Code-Over-Files Configuration**:

   - Environment variables set in `src/test/setup.ts` (no `.env.test` files)
   - MSW configuration controlled programmatically
   - Zero external configuration dependencies

2. **Isolation & Cleanup**:

   - Clean database state before each test
   - DOM cleanup to prevent element accumulation
   - Handler reset after each test
   - No shared state between tests

3. **Performance Optimization**:

   - Zero API delays in test mode (`enableDelay: false`)
   - Parallel test execution with forked processes
   - Efficient in-memory database operations
   - Minimal logging to reduce I/O overhead

4. **Realistic Testing**:
   - MSW intercepts actual HTTP requests
   - Same API handlers for development and testing
   - Comprehensive error scenario coverage
   - Real component lifecycle testing

#### Test Metrics

- **Current Coverage**: Tracked via Vitest coverage reports
- **Test Execution Speed**: Optimized for sub-second test runs
- **Test Isolation**: 100% isolated test execution with forks
- **MSW Integration**: Zero unhandled API requests in tests

### Test Infrastructure

- **Backend**: In-Memory Databases, Test Containers, Mock Services
- **Frontend**: MSW Node.js Server, jsdom Environment, In-Memory Database
- **Shared**: Docker Compose for full-stack integration testing (planned)

## CI/CD Pipeline

### GitHub Actions Workflow

```
1. Code Quality Checks
   ├─ Unit Tests (Both Services)
   ├─ Integration Tests
   ├─ Code Coverage Analysis
   └─ Security Scanning

2. Build & Package
   ├─ Docker Image Building
   ├─ Container Registry Push
   └─ Version Tagging

3. Infrastructure Deployment
   ├─ Bicep Template Validation
   ├─ Azure Resource Deployment
   └─ Configuration Management

4. Application Deployment
   ├─ Container App Updates
   ├─ Database Migrations
   ├─ Health Check Verification
   └─ Rollback Capability
```

## Future Enhancements

### Planned Features

- **API Gateway**: Centralized routing and rate limiting
- **Service Mesh**: Advanced service-to-service communication
- **Data Analytics**: Temperature trend analysis and predictions
- **Mobile APIs**: Dedicated endpoints for mobile applications
- **Real-time Notifications**: WebSocket/SignalR integration

### Scalability Improvements

- **Event Sourcing**: Complete event history storage
- **CQRS**: Command-Query Responsibility Segregation
- **Read Replicas**: Database read scaling
- **Microservice Decomposition**: Further service splitting

This architecture provides a solid foundation for a scalable, maintainable, and secure microservices application while following modern cloud-native development practices.
