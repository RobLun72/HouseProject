# House Project with PostgreSQL

This project demonstrates both HouseService and TemperatureService configured to use PostgreSQL databases running in Docker containers.

## Prerequisites

- Docker and Docker Compose
- .NET 8.0 SDK
- PostgreSQL client (optional, for direct database access)

## Architecture

The project consists of two independent microservices:

1. **HouseService** - Manages houses and rooms with its own PostgreSQL database
2. **TemperatureService** - Manages temperature readings with its own PostgreSQL database and syncs house/room data from HouseService

## Quick Start

### 1. Start All Services with Docker Compose

From the project root directory:

```bash
docker-compose up --build
```

This will start:

- **House PostgreSQL** on port 5434 (housedb)
- **Temperature PostgreSQL** on port 5433 (temperaturedb)
- **HouseService** on port 5001
- **TemperatureService** on port 5002

### 2. Start Individual Databases

For local development:

```bash
# Start only PostgreSQL databases
docker-compose up house-postgres postgres -d

# Or start specific services
docker-compose up house-postgres -d      # HouseService database
docker-compose up postgres -d            # TemperatureService database
```

### 3. Run Services Locally

```bash
# Terminal 1 - HouseService
cd HouseService
dotnet run

# Terminal 2 - TemperatureService
cd TemperatureService
dotnet run
```

## Database Configuration

### HouseService Database

- **Host**: localhost
- **Port**: 5434
- **Database**: housedb
- **Username**: houseuser
- **Password**: housepass123

### TemperatureService Database

- **Host**: localhost
- **Port**: 5433
- **Database**: temperaturedb
- **Username**: tempuser
- **Password**: temppass123

## Database Schema

The database includes three main tables:

### Houses

- HouseId (Primary Key)
- Name
- Area

### Rooms

- RoomId (Primary Key)
- HouseId (Foreign Key)
- Area
- Placement

### Temperatures

- TempId (Primary Key)
- RoomId (Foreign Key)
- Hour
- Degrees
- Unique constraint on (RoomId, Hour)

## API Endpoints

### Temperature Endpoints

- `GET /Temperature` - Get all temperatures
- `GET /Temperature/{id}` - Get specific temperature
- `GET /Temperature/room/{roomId}` - Get temperatures for a room
- `GET /Temperature/room/{roomId}/hour/{hour}` - Get temperature for room at specific hour
- `POST /Temperature` - Create new temperature reading
- `PUT /Temperature/{id}` - Update temperature reading
- `DELETE /Temperature/{id}` - Delete temperature reading

### House Endpoints (Independent)

- `GET /House` - Get all houses
- `GET /House/{id}` - Get specific house
- `GET /House/{id}/rooms` - Get rooms in a house
- `POST /House` - Create new house
- `PUT /House/{id}` - Update house
- `DELETE /House/{id}` - Delete house

### Room Endpoints (Independent)

- `GET /Room` - Get all rooms
- `GET /Room/{id}` - Get specific room
- `GET /Room/house/{houseId}` - Get rooms by house
- `POST /Room` - Create new room
- `PUT /Room/{id}` - Update room
- `DELETE /Room/{id}` - Delete room

### Sync Endpoints

- `POST /Sync/house-data` - Receive sync messages from HouseService

## Database Connection

### Local Development

Connection string: `Host=localhost;Port=5433;Database=temperaturedb;Username=tempuser;Password=temppass123;`

### Docker Environment

Connection string: `Host=postgres;Port=5432;Database=temperaturedb;Username=tempuser;Password=temppass123;`

## Data Synchronization

The Temperature Service receives sync messages from the House Service when house or room data changes. This ensures both services maintain consistent data while operating independently.

## Troubleshooting

### PostgreSQL Connection Issues

1. Ensure PostgreSQL container is running: `docker ps`
2. Check container logs: `docker logs temperature-postgres`
3. Verify connection string in appsettings.json

### Database Issues

1. Reset database: `docker-compose down -v && docker-compose up postgres -d`
2. Check EF migrations: `dotnet ef migrations list`
3. Force recreate database: Delete Migrations folder and run `dotnet ef migrations add InitialCreate`

## Development

### Adding New Migrations

```bash
dotnet ef migrations add MigrationName
```

### Updating Database

```bash
dotnet ef database update
```

### Viewing Database

Connect using any PostgreSQL client:

- Host: localhost
- Port: 5433
- Database: temperaturedb
- Username: tempuser
- Password: temppass123
