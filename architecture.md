# HouseProject Architecture Documentation

## Overview

HouseProject is a microservices-based application for managing houses, rooms, and temperature data. The system follows Domain-Driven Design (DDD) principles with event-driven communication between services.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Client Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Swagger UI (Dev)  │  External APIs  │  CI/CD Pipeline  │  Monitoring Tools │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                    HTTPS/API Keys
                                        │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Application Layer                                │
├───────────────────────────────┬─────────────────────────────────────────────┤
│          HouseService         │         TemperatureService                  │
│                               │                                             │
│  • House Management           │  • Temperature Data                         │
│  • Room Management            │  • House/Room Synchronization               │
│  • Event Publishing           │  • Event Consumption                        │
│  • API Key Authentication     │  • API Key Authentication                   │
└───────────────────────────────┴─────────────────────────────────────────────┘
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
│                               │  • EF Core Migrations                       │
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

## Security Architecture

### Authentication & Authorization

- **API Key Authentication**: Both services require API keys for access
- **HTTPS Only**: All communication is encrypted in transit
- **Environment-based Keys**: Different API keys per environment

### Network Security

- **Container Networks**: Isolated Docker networks for service groups
- **Database Isolation**: Separate PostgreSQL instances per service
- **Message Bus Security**: Authenticated RabbitMQ/Service Bus access

## Deployment Architecture

### Local Development (Docker Compose)

```
Networks:
├─ house-network (HouseService ↔ House PostgreSQL)
├─ temperature-network (TemperatureService ↔ Temperature PostgreSQL)
└─ messaging-network (Both Services ↔ RabbitMQ)

Ports:
├─ 7001: HouseService HTTPS
├─ 7002: TemperatureService HTTPS
├─ 5434: House PostgreSQL
├─ 5433: Temperature PostgreSQL
├─ 5672: RabbitMQ AMQP
└─ 15672: RabbitMQ Management UI
```

### Azure Container Apps (Production)

```
Azure Container Apps Environment
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
├─ Azure Container Registry
├─ Azure Key Vault (Secrets)
├─ Application Insights (Monitoring)
└─ Log Analytics Workspace
```

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

## Testing Strategy

### Unit Tests

- **Controller Tests**: API endpoint validation
- **Service Tests**: Business logic verification
- **Repository Tests**: Data access layer testing

### Integration Tests

- **End-to-End**: Full request/response cycles
- **Database Integration**: Real database operations
- **Message Bus**: Event publishing/consumption testing

### Test Infrastructure

- **In-Memory Databases**: Fast test execution
- **Test Containers**: Isolated test environments
- **Mock Services**: External dependency simulation

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
