# Azure Infrastructure Deployment Script (PowerShell)
# Usage: .\deploy.ps1 -Environment <env> -ResourceGroup <rg> [-Location <location>]
# Example: .\deploy.ps1 -Environment dev -ResourceGroup rg-houseproject-dev

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "rg-houseproject-$Environment",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus"
)

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
    Write-ColorOutput "🚀 Starting Azure Infrastructure Deployment" "Green"
    Write-ColorOutput "Environment: $Environment" "Yellow"
    Write-ColorOutput "Resource Group: $ResourceGroup" "Yellow"
    Write-ColorOutput "Location: $Location" "Yellow"

    # Check if logged in to Azure
    Write-ColorOutput "Checking Azure login status..." "Yellow"
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-ColorOutput "❌ Please login to Azure using 'az login'" "Red"
        exit 1
    }

    # Create resource group if it doesn't exist
    Write-ColorOutput "Creating resource group if it doesn't exist..." "Yellow"
    az group create --name $ResourceGroup --location $Location --output none

    # Deploy infrastructure
    Write-ColorOutput "🏗️  Deploying infrastructure..." "Yellow"
    $deploymentName = "main-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    # Check if parameter file exists
    $paramFile = ".\parameters\$Environment.bicepparam"
    if (-not (Test-Path $paramFile)) {
        Write-ColorOutput "❌ Parameter file not found: $paramFile" "Red"
        exit 1
    }

    az deployment group create `
        --resource-group $ResourceGroup `
        --template-file .\main.bicep `
        --parameters $paramFile `
        --name $deploymentName `
        --output table

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✅ Infrastructure deployment completed successfully!" "Green"
        
        # Get deployment outputs
        Write-ColorOutput "📋 Getting deployment outputs..." "Yellow"
        $containerRegistry = az deployment group show `
            --resource-group $ResourceGroup `
            --name $deploymentName `
            --query 'properties.outputs.containerRegistryLoginServer.value' `
            --output tsv

        $containerAppEnvId = az deployment group show `
            --resource-group $ResourceGroup `
            --name $deploymentName `
            --query 'properties.outputs.containerAppEnvironmentId.value' `
            --output tsv

        $containerAppEnvDomain = az deployment group show `
            --resource-group $ResourceGroup `
            --name $deploymentName `
            --query 'properties.outputs.containerAppEnvironmentDomain.value' `
            --output tsv

        Write-ColorOutput "📦 Container Registry: $containerRegistry" "Green"
        Write-ColorOutput "🏠 Container App Environment: $containerAppEnvDomain" "Green"
        
        # Save outputs to file for CI/CD pipeline
        $outputData = @{
            containerRegistryLoginServer = $containerRegistry
            containerAppEnvironmentId = $containerAppEnvId
            containerAppEnvironmentDomain = $containerAppEnvDomain
            resourceGroup = $ResourceGroup
            environment = $Environment
        }
        
        $outputData | ConvertTo-Json | Out-File -FilePath "deployment-outputs.json" -Encoding UTF8
        
        Write-ColorOutput "💾 Deployment outputs saved to deployment-outputs.json" "Green"
        Write-ColorOutput "🎉 Ready for application deployment!" "Green"
        Write-ColorOutput "Next steps:" "Yellow"
        Write-ColorOutput "  1. Build and push container images to: $containerRegistry" "White"
        Write-ColorOutput "  2. Deploy applications using: .\deploy-apps.ps1 -Environment $Environment" "White"
        
    } else {
        Write-ColorOutput "❌ Infrastructure deployment failed!" "Red"
        exit 1
    }
}
catch {
    Write-ColorOutput "❌ An error occurred: $($_.Exception.Message)" "Red"
    exit 1
}