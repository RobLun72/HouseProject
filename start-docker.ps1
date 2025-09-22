Write-Host "=== House Project Docker Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Clean up any existing containers and volumes if requested
if ($args[0] -eq "clean") {
    Write-Host "🧹 Cleaning up existing containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v
    docker system prune -f
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}

Write-Host "🚀 Starting services..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will start:" -ForegroundColor White
Write-Host "  - PostgreSQL (House DB) on port 5434" -ForegroundColor Gray
Write-Host "  - PostgreSQL (Temperature DB) on port 5433" -ForegroundColor Gray
Write-Host "  - HouseService on port 5001" -ForegroundColor Gray
Write-Host "  - TemperatureService on port 5002" -ForegroundColor Gray
Write-Host ""

# Build and start all services
docker-compose up --build

Write-Host ""
Write-Host "✅ Services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access points:" -ForegroundColor Cyan
Write-Host "  - HouseService API: http://localhost:5001" -ForegroundColor White
Write-Host "  - HouseService Swagger: http://localhost:5001/swagger" -ForegroundColor White
Write-Host "  - TemperatureService API: http://localhost:5002" -ForegroundColor White
Write-Host "  - TemperatureService Swagger: http://localhost:5002/swagger" -ForegroundColor White
Write-Host ""
Write-Host "📊 Database connections:" -ForegroundColor Cyan
Write-Host "  - House DB: localhost:5434 (houseuser/housepass123)" -ForegroundColor White
Write-Host "  - Temperature DB: localhost:5433 (tempuser/temppass123)" -ForegroundColor White