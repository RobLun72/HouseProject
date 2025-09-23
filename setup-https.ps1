# PowerShell script to set up HTTPS development certificates for Docker

Write-Host "Setting up HTTPS development certificates for Docker..." -ForegroundColor Green

# Step 1: Generate development certificate if it doesn't exist
Write-Host "1. Generating development certificate..." -ForegroundColor Yellow
try {
    dotnet dev-certs https --clean
    dotnet dev-certs https --trust
    Write-Host "   ✓ Certificate generated and trusted" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error generating certificate: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Export certificate for Docker
Write-Host "2. Exporting certificate for Docker..." -ForegroundColor Yellow
$httpsDir = "$env:USERPROFILE\.aspnet\https"
if (-not (Test-Path $httpsDir)) {
    New-Item -ItemType Directory -Path $httpsDir -Force | Out-Null
}

try {
    dotnet dev-certs https -ep "$httpsDir\aspnetapp.pfx" -p "crypticpassword"
    Write-Host "   ✓ Certificate exported to $httpsDir\aspnetapp.pfx" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error exporting certificate: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Verify certificate exists
if (Test-Path "$httpsDir\aspnetapp.pfx") {
    Write-Host "3. Certificate verification:" -ForegroundColor Yellow
    Write-Host "   ✓ Certificate file exists at: $httpsDir\aspnetapp.pfx" -ForegroundColor Green
    Write-Host "   ✓ Certificate is ready for Docker containers" -ForegroundColor Green
} else {
    Write-Host "3. Certificate verification:" -ForegroundColor Yellow
    Write-Host "   ✗ Certificate file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup complete! You can now run:" -ForegroundColor Green
Write-Host "  docker-compose up --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services will be available at (HTTPS-Only):" -ForegroundColor Green
Write-Host "  • HouseService:       https://localhost:7001 (Secure)" -ForegroundColor Cyan
Write-Host "  • TemperatureService: https://localhost:7002 (Secure)" -ForegroundColor Cyan
Write-Host "  • RabbitMQ Management: http://localhost:15672" -ForegroundColor Cyan
Write-Host ""
Write-Host "Security Benefits:" -ForegroundColor Green
Write-Host "  ✓ All API traffic encrypted with TLS/SSL" -ForegroundColor Yellow
Write-Host "  ✓ No HTTP endpoints exposed externally" -ForegroundColor Yellow
Write-Host "  ✓ Automatic HTTP-to-HTTPS redirection" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: The first time you access the HTTPS endpoints, your browser may show a security warning." -ForegroundColor Yellow
Write-Host "This is normal for development certificates. Click 'Advanced' and 'Proceed to localhost'." -ForegroundColor Yellow