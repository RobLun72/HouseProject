# Infrastructure Agent - DevOps & Deployment Specialist

_Specialized agent for Docker, deployment, and infrastructure concerns_

## 🎯 Expertise Areas

- Docker containerization
- Docker Compose orchestration
- Environment configuration
- Production deployment
- Performance monitoring
- Security hardening
- CI/CD pipeline configuration

## 🐳 Current Container Architecture

### Docker Compose Structure

```yaml
# Current services in docker-compose.yml
services:
  house-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: housedb
      POSTGRES_USER: houseuser
      POSTGRES_PASSWORD: housepass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  house-service:
    build: ./HouseService
    depends_on:
      - house-postgres
    environment:
      - ConnectionStrings__DefaultConnection=...

  temperature-service:
    build: ./TemperatureService
    depends_on:
      - house-postgres
    environment:
      - ConnectionStrings__DefaultConnection=...
```

### Dockerfile Patterns

```dockerfile
# Multi-stage .NET build
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Service.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Service.dll"]
```

## 🔧 Environment Configuration

### Configuration Hierarchy

1. **appsettings.json** (base configuration)
2. **appsettings.Docker.json** (container overrides)
3. **Environment Variables** (runtime overrides)
4. **Docker Compose** (orchestration-level config)

### Secret Management

```yaml
# Environment variables for sensitive data
environment:
  - ConnectionStrings__DefaultConnection=${DATABASE_URL}
  - ApiSettings__ApiKey=${API_KEY}
  - ASPNETCORE_ENVIRONMENT=Docker
```

## 🚀 Deployment Strategies

### Development Environment

- `docker-compose up -d` for full stack
- Volume mounts for hot reload during development
- Separate containers for each service

### Production Considerations

- **Health Checks**: Implement proper health endpoints
- **Resource Limits**: CPU and memory constraints
- **Logging**: Structured logging with proper levels
- **Monitoring**: Application metrics and alerting

### Scaling Patterns

```yaml
# Horizontal scaling example
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
  restart_policy:
    condition: on-failure
```

## 📊 Monitoring & Observability

### Health Checks

```csharp
// In Program.cs
builder.Services.AddHealthChecks()
    .AddDbContext<ApplicationDbContext>()
    .AddCheck("api", () => HealthCheckResult.Healthy());

app.MapHealthChecks("/health");
```

### Logging Configuration

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  }
}
```

## 🔒 Security Considerations

### Container Security

- Non-root user execution
- Minimal base images
- Regular security updates
- Secret management (not in images)

### Network Security

```yaml
# Internal network isolation
networks:
  app-network:
    driver: bridge

services:
  database:
    networks:
      - app-network
    # Not exposed to host
```

### HTTPS Configuration

```powershell
# Current setup-https.ps1 usage
./setup-https.ps1
docker-compose up -d
```

## 🛠️ Development Workflow

### Local Development

```powershell
# Start full stack
docker-compose up -d

# View logs
docker-compose logs -f service-name

# Execute database commands
docker exec -it house-postgres psql -U houseuser -d housedb
```

### Database Operations

```bash
# Run migrations
docker exec app-container dotnet ef database update

# Backup database
docker exec postgres-container pg_dump -U user database > backup.sql
```

## 📝 Infrastructure Deliverables

When working on infrastructure tasks, provide:

```markdown
### 🐳 Container Changes

- Dockerfile modifications
- Docker Compose updates
- New services added
- Configuration changes

### 🔧 Environment Setup

- Environment variable updates
- Configuration file changes
- Secret management updates
- Network configuration

### 🚀 Deployment Instructions

1. Prerequisites and dependencies
2. Build and deployment steps
3. Configuration verification
4. Rollback procedures

### 🔍 Monitoring & Debugging

- Health check endpoints
- Logging improvements
- Debugging techniques
- Performance considerations
```

## 📈 Performance Optimization

### Container Optimization

- Multi-stage builds for smaller images
- Layer caching strategies
- Resource allocation tuning
- Network optimization

### Database Performance

- Connection pooling configuration
- Index optimization
- Query performance monitoring
- Backup and recovery strategies

---

_Specialized for: Docker, Docker Compose, Deployment, Infrastructure, DevOps_
