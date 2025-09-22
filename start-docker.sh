#!/bin/bash

echo "=== House Project Docker Setup ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Clean up any existing containers and volumes if requested
if [ "$1" = "clean" ]; then
    echo "🧹 Cleaning up existing containers and volumes..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete"
fi

echo "🚀 Starting services..."
echo ""
echo "This will start:"
echo "  - PostgreSQL (House DB) on port 5434"
echo "  - PostgreSQL (Temperature DB) on port 5433" 
echo "  - HouseService on port 5001"
echo "  - TemperatureService on port 5002"
echo ""

# Build and start all services
docker-compose up --build

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🌐 Access points:"
echo "  - HouseService API: http://localhost:5001"
echo "  - HouseService Swagger: http://localhost:5001/swagger"
echo "  - TemperatureService API: http://localhost:5002"
echo "  - TemperatureService Swagger: http://localhost:5002/swagger"
echo ""
echo "📊 Database connections:"
echo "  - House DB: localhost:5434 (houseuser/housepass123)"
echo "  - Temperature DB: localhost:5433 (tempuser/temppass123)"