# HouseProject

A microservices-based application for managing houses, rooms, and temperature data with real-time synchronization.

## Project Structure

```
HouseProject/
├── Back-end/                    # Backend services and contracts
│   ├── HouseService/           # House and room management service
│   ├── HouseService.Tests/     # HouseService unit tests
│   ├── TemperatureService/     # Temperature readings service
│   ├── TemperatureService.Tests/ # TemperatureService unit tests
│   └── MessageContracts/       # Shared message contracts
├── Front-end/                  # React frontend application
├── infrastructure/             # Azure deployment scripts
└── init-scripts/              # Database initialization scripts
```

## Services

- **HouseService**: Manages houses and rooms
- **TemperatureService**: Manages temperature readings and synchronized house/room data
- **PostgreSQL**: Database for both services (separate databases)
- **RabbitMQ**: Message broker for inter-service communication

## HTTPS Setup (Required)

Before running the services, you need to set up HTTPS development certificates:

### Option 1: Use the Setup Script (Recommended)

```powershell
.\setup-https.ps1
```

### Option 2: Manual Setup

```powershell
# Clean and generate new certificate
dotnet dev-certs https --clean
dotnet dev-certs https --trust

# Export certificate for Docker
dotnet dev-certs https -ep $env:USERPROFILE\.aspnet\https\aspnetapp.pfx -p ""
```

## Running the Application

1. **Setup HTTPS certificates** (see above)

2. **Start all services**:

   ```bash
   docker-compose up --build
   ```

3. **Access the services** (HTTPS-Only - Secure):

   - **HouseService**:

     - 🔒 HTTPS: https://localhost:7001
     - 📚 Swagger: https://localhost:7001/swagger

   - **TemperatureService**:

     - 🔒 HTTPS: https://localhost:7002
     - 📚 Swagger: https://localhost:7002/swagger

   - **RabbitMQ Management**: http://localhost:15672
     - Username: `admin`
     - Password: `admin123`

   > **Security Note**: Only HTTPS endpoints are exposed externally. HTTP is used internally for redirects to HTTPS.

## API Authentication

All endpoints require an API key in the `X-Api-Key` header:

- `dev-key-123456789`
- `test-key-987654321`
- `prod-key-abcdef123`

## Testing

Both services include comprehensive test suites:

### HouseService Tests

```bash
cd Back-end/HouseService.Tests
dotnet test
```

### TemperatureService Tests

```bash
cd Back-end/TemperatureService.Tests
dotnet test
```

## Architecture

- **Event-Driven Architecture**: Services communicate via RabbitMQ messages
- **CQRS Pattern**: Separate read/write operations
- **API Gateway Pattern**: Each service exposes its own API
- **Database Per Service**: Each service has its own PostgreSQL database

## Development

- .NET 8.0
- Entity Framework Core 8.0
- PostgreSQL 15
- RabbitMQ 3
- Docker & Docker Compose
- xUnit for testing
