# Azure Container Apps Deployment Script (PowerShell)
# Usage: .\deploy-apps.ps1 -Environment <env> [-ImageTag <tag>]
# Example: .\deploy-apps.ps1 -Environment dev -ImageTag v1.0.0

param(
    [Parameter(Mandatory=$true)]
    [string]$Environment,
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "latest"
)

$outputsFile = "deployment-outputs.json"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "White" = [ConsoleColor]::White
    }
    
    Write-Host $Message -ForegroundColor $colors[$Color]
}

try {
    Write-ColorOutput "🚀 Starting Container Apps Deployment" "Green"
    Write-ColorOutput "Environment: $Environment" "Yellow"
    Write-ColorOutput "Image Tag: $ImageTag" "Yellow"

    # Check if deployment outputs file exists
    if (-not (Test-Path $outputsFile)) {
        Write-ColorOutput "❌ Deployment outputs file not found: $outputsFile" "Red"
        Write-ColorOutput "Please run infrastructure deployment first: .\deploy.ps1 -Environment $Environment" "Yellow"
        exit 1
    }

    # Read deployment outputs
    $outputs = Get-Content $outputsFile | ConvertFrom-Json
    $resourceGroup = $outputs.resourceGroup
    $containerRegistry = $outputs.containerRegistryLoginServer
    $containerAppEnvId = $outputs.containerAppEnvironmentId
    $containerAppEnvDomain = $outputs.containerAppEnvironmentDomain

    Write-ColorOutput "Resource Group: $resourceGroup" "Yellow"
    Write-ColorOutput "Container Registry: $containerRegistry" "Yellow"

    # Get container registry credentials
    Write-ColorOutput "🔑 Getting container registry credentials..." "Yellow"
    $registryName = $containerRegistry.Split('.')[0]
    $registryUsername = az acr credential show --name $registryName --query 'username' --output tsv
    $registryPassword = az acr credential show --name $registryName --query 'passwords[0].value' --output tsv

    # Get Application Insights connection string
    $aiConnection = az monitor app-insights component show `
        --app "ai-houseproject-$Environment" `
        --resource-group $resourceGroup `
        --query 'connectionString' `
        --output tsv 2>$null

    if (-not $aiConnection) {
        $aiConnection = ""
    }

    # For development, use simple connection strings and API keys
    # In production, these should come from Key Vault
    $apiKeys = "dev-api-key-123"
    if ($Environment -eq "prod") {
        $apiKeys = $env:API_KEYS
        if (-not $apiKeys) {
            Write-ColorOutput "❌ API_KEYS environment variable is required for production deployment" "Red"
            exit 1
        }
    }

    # Note: For this example, we're using placeholder connection strings
    # In a real deployment, you would retrieve these from the Key Vault or construct them from the deployment outputs
    $houseDbConnection = "Host=psql-houseproject-$Environment.postgres.database.azure.com;Database=housedb;Username=houseadmin;Password=placeholder"
    $temperatureDbConnection = "Host=psql-houseproject-$Environment.postgres.database.azure.com;Database=temperaturedb;Username=houseadmin;Password=placeholder"
    $serviceBusConnection = "Endpoint=sb://sb-houseproject-$Environment.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=placeholder"

    # Deploy Container Apps
    Write-ColorOutput "📦 Deploying Container Apps..." "Yellow"
    $appsDeploymentName = "apps-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    az deployment group create `
        --resource-group $resourceGroup `
        --template-file .\apps.bicep `
        --parameters `
            environment=$Environment `
            containerRegistryLoginServer=$containerRegistry `
            containerRegistryUsername=$registryUsername `
            containerRegistryPassword=$registryPassword `
            containerAppEnvironmentId=$containerAppEnvId `
            containerAppEnvironmentDomain=$containerAppEnvDomain `
            houseDbConnectionString=$houseDbConnection `
            temperatureDbConnectionString=$temperatureDbConnection `
            serviceBusConnectionString=$serviceBusConnection `
            apiKeys=$apiKeys `
            applicationInsightsConnectionString=$aiConnection `
            imageTag=$ImageTag `
        --name $appsDeploymentName `
        --output table

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Container Apps deployment completed successfully!" "Green"
        
        # Get service URLs
        $houseServiceUrl = az deployment group show `
            --resource-group $resourceGroup `
            --name $appsDeploymentName `
            --query 'properties.outputs.houseServiceUrl.value' `
            --output tsv

        $temperatureServiceUrl = az deployment group show `
            --resource-group $resourceGroup `
            --name $appsDeploymentName `
            --query 'properties.outputs.temperatureServiceUrl.value' `
            --output tsv

        Write-ColorOutput "🎉 Deployment Complete!" "Green"
        Write-ColorOutput "🏠 House Service URL: $houseServiceUrl" "Green"
        Write-ColorOutput "🌡️  Temperature Service URL: $temperatureServiceUrl" "Green"
        Write-ColorOutput "🔍 You can test the APIs using the provided URLs" "Yellow"
        
    } else {
        Write-ColorOutput "❌ Container Apps deployment failed!" "Red"
        exit 1
    }
}
catch {
    Write-ColorOutput "❌ An error occurred: $($_.Exception.Message)" "Red"
    exit 1
}