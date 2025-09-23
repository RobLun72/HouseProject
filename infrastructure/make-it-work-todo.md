# Make It Work TODO - HouseProject Azure Deployment

This is a practical checklist to get your HouseProject deployed to Azure using the Infrastructure as Code templates. Follow these steps in order.

## ✅ Prerequisites Checklist

### 1. Azure Setup

- [ ] **Azure Subscription**: Have an active Azure subscription
- [ ] **Azure CLI**: Install Azure CLI on your machine

  ```bash
  # Windows (using winget)
  winget install Microsoft.AzureCLI

  # Or download from: https://aka.ms/installazurecliwindows
  ```

- [ ] **Login to Azure**: Authenticate with your Azure account
  ```bash
  az login
  az account list --output table
  az account set --subscription "Your-Subscription-Name-or-ID"
  ```
- [ ] **Bicep Extension**: Install Bicep for Azure CLI
  ```bash
  az bicep install
  az bicep version
  ```

### 2. Development Tools

- [ ] **Docker Desktop**: Install and start Docker Desktop
- [ ] **Git**: Ensure Git is installed and configured
- [ ] **.NET 8 SDK**: Install .NET 8 SDK for building the applications

### 3. Repository Setup

- [ ] **Clone Repository**: Have the HouseProject repository locally
- [ ] **Branch**: Currently on `fix-https` branch (good for testing)

## 🚀 Deployment Steps

### Step 1: Prepare Your Environment

- [ ] **Choose Environment**: Decide on environment name (e.g., `dev`, `staging`, `prod`)
- [ ] **Set Variables**: Define your deployment variables
  ```powershell
  $Environment = "dev"  # or "staging", "prod"
  $ResourceGroup = "rg-houseproject-$Environment"
  $Location = "eastus"  # or your preferred Azure region
  ```

### Step 2: Update Parameter Files (IMPORTANT!)

- [ ] **Edit Parameter File**: Update the parameter file for your environment
  ```powershell
  # Edit this file: infrastructure/parameters/dev.bicepparam
  ```
- [ ] **Change Default Passwords**:
  - [ ] Update `postgresAdminPassword` (make it strong!)
  - [ ] Update `apiKeys` (use a secure random string)
  - [ ] Update `postgresAdminLogin` if desired

**Example secure values:**

```bicep
param postgresAdminLogin = 'houseadmin'
param postgresAdminPassword = 'MySecure!Password123#'  // Change this!
param apiKeys = 'sk-1a2b3c4d5e6f7g8h9i0j'  // Change this!
```

### Step 3: Deploy Infrastructure

- [ ] **Navigate to Infrastructure Folder**:

  ```powershell
  cd C:\work\Projects\HouseProject\infrastructure
  ```

- [ ] **Run Infrastructure Deployment**:

  ```powershell
  .\deploy.ps1 -Environment dev -ResourceGroup rg-houseproject-dev -Location eastus
  ```

- [ ] **Wait for Completion**: This takes 10-15 minutes
- [ ] **Verify Success**: Check that `deployment-outputs.json` was created
- [ ] **Note Container Registry URL**: Save the registry URL from the output

### Step 4: Build and Push Container Images

- [ ] **Get Registry Details**: From deployment output or Azure portal

  ```powershell
  # Get registry name from the deployment outputs
  $outputs = Get-Content .\deployment-outputs.json | ConvertFrom-Json
  $registryUrl = $outputs.containerRegistryLoginServer
  Write-Host "Registry URL: $registryUrl"
  ```

- [ ] **Login to Container Registry**:

  ```powershell
  # Extract registry name (remove .azurecr.io)
  $registryName = $registryUrl.Split('.')[0]
  az acr login --name $registryName
  ```

- [ ] **Build HouseService Image**:

  ```powershell
  cd C:\work\Projects\HouseProject
  docker build -t $registryUrl/houseservice:v1.0.0 -f HouseService/Dockerfile .
  ```

- [ ] **Build TemperatureService Image**:

  ```powershell
  docker build -t $registryUrl/temperatureservice:v1.0.0 -f TemperatureService/Dockerfile .
  ```

- [ ] **Push Images to Registry**:

  ```powershell
  docker push $registryUrl/houseservice:v1.0.0
  docker push $registryUrl/temperatureservice:v1.0.0
  ```

- [ ] **Verify Images**: Check in Azure portal that images are in the registry

### Step 5: Deploy Applications

- [ ] **Update Connection Strings** (Critical Step):

  The deployment scripts have placeholder connection strings. You need to get the real ones:

  ```powershell
  # Get the actual database server names
  $resourceGroup = "rg-houseproject-dev"
  $houseServer = az postgres flexible-server list --resource-group $resourceGroup --query "[?contains(name, 'house')].fullyQualifiedDomainName" --output tsv
  $tempServer = az postgres flexible-server list --resource-group $resourceGroup --query "[?contains(name, 'temperature')].fullyQualifiedDomainName" --output tsv

  Write-Host "House DB Server: $houseServer"
  Write-Host "Temperature DB Server: $tempServer"
  ```

- [ ] **Get Database Password**: Use the password from your parameter file

- [ ] **Update deploy-apps.ps1**: Edit the connection strings in the script:

  ```powershell
  # Around line 70-72, replace with actual values:
  $houseDbConnection = "Host=$houseServer;Database=housedb;Username=houseadmin;Password=YourActualPassword;SslMode=Require"
  $temperatureDbConnection = "Host=$tempServer;Database=temperaturedb;Username=houseadmin;Password=YourActualPassword;SslMode=Require"
  ```

- [ ] **Get Service Bus Connection String**:

  ```powershell
  $serviceBusNamespace = az servicebus namespace list --resource-group $resourceGroup --query "[0].name" --output tsv
  $serviceBusConnection = az servicebus namespace authorization-rule keys list --namespace-name $serviceBusNamespace --resource-group $resourceGroup --name RootManageSharedAccessKey --query "primaryConnectionString" --output tsv
  ```

- [ ] **Update Service Bus Connection**: Replace in deploy-apps.ps1

- [ ] **Deploy Applications**:
  ```powershell
  .\deploy-apps.ps1 -Environment dev -ImageTag v1.0.0
  ```

### Step 6: Test Your Deployment

- [ ] **Get Service URLs**: From deployment output
- [ ] **Test HouseService**:

  ```powershell
  # Replace with your actual URL
  $houseUrl = "https://your-house-service-url"
  Invoke-RestMethod "$houseUrl/api/houses" -Headers @{"X-API-Key" = "your-api-key"}
  ```

- [ ] **Test TemperatureService**:
  ```powershell
  $tempUrl = "https://your-temperature-service-url"
  Invoke-RestMethod "$tempUrl/api/temperatures" -Headers @{"X-API-Key" = "your-api-key"}
  ```

## 🐛 Troubleshooting Common Issues

### Issue: "Access Denied" to Container Registry

- [ ] **Solution**: Run `az acr login --name <registry-name>` again
- [ ] **Check**: Ensure you have Contributor role on the resource group

### Issue: Container Apps Won't Start

- [ ] **Check Logs**:
  ```powershell
  az containerapp logs show --name <app-name> --resource-group <rg> --follow
  ```
- [ ] **Common Causes**:
  - [ ] Wrong connection strings
  - [ ] Missing environment variables
  - [ ] Container image not found

### Issue: Database Connection Failures

- [ ] **Check Firewall**: Ensure "Allow Azure Services" is enabled
- [ ] **Verify Connection String**: Test connection string format
- [ ] **Check SSL**: Ensure `SslMode=Require` is in connection string

### Issue: Service-to-Service Communication Fails

- [ ] **Check URLs**: Verify service URLs in environment variables
- [ ] **API Keys**: Ensure API keys match between services
- [ ] **Network**: Check Container Apps environment networking

## 📝 Quick Commands Reference

```powershell
# Check deployment status
az deployment group show --name <deployment-name> --resource-group <rg>

# View container app logs
az containerapp logs show --name <app-name> --resource-group <rg> --follow

# List all resources in resource group
az resource list --resource-group <rg> --output table

# Get container app URL
az containerapp show --name <app-name> --resource-group <rg> --query properties.configuration.ingress.fqdn

# Check database status
az postgres flexible-server show --name <server-name> --resource-group <rg>

# Test API endpoint
Invoke-RestMethod "https://your-app-url/api/endpoint" -Headers @{"X-API-Key" = "your-key"}
```

## ✅ Success Criteria

You know it's working when:

- [ ] Both Container Apps show "Running" status in Azure portal
- [ ] You can access both service URLs via HTTPS
- [ ] API endpoints return data (not 404 or 500 errors)
- [ ] Services can communicate with each other
- [ ] Database connections are successful
- [ ] Application Insights shows telemetry data

## 🔄 Clean Up (When Done Testing)

- [ ] **Delete Resource Group**:
  ```powershell
  az group delete --name rg-houseproject-dev --yes --no-wait
  ```

## 📞 Need Help?

If you get stuck:

1. Check the main `README.md` for detailed documentation
2. Look at Azure portal for resource status and logs
3. Use `az containerapp logs show` to see application logs
4. Verify all connection strings and secrets are correct

---

**Remember**: The first deployment always takes the longest. Once you have it working, subsequent deployments are much faster!
