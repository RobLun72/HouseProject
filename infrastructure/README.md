# Azure Infrastructure for HouseProject

This directory contains Azure Bicep templates and deployment scripts for deploying the HouseProject microservices to Azure Container Apps.

## Architecture

The infrastructure includes:

- **Azure Container Apps**: Serverless containers for HouseService and TemperatureService
- **Azure Container Registry**: Private container registry for storing application images
- **PostgreSQL Flexible Servers**: Separate databases for each service
- **Azure Service Bus**: Message broker for inter-service communication
- **Azure Key Vault**: Secure storage for secrets and connection strings
- **Application Insights**: Application monitoring and telemetry
- **Log Analytics Workspace**: Centralized logging for Container Apps

## Directory Structure

```
infrastructure/
├── main.bicep                 # Main infrastructure template
├── apps.bicep                 # Container Apps deployment template
├── parameters/                # Environment-specific parameters
│   ├── dev.bicepparam         # Development environment
│   ├── staging.bicepparam     # Staging environment
│   └── prod.bicepparam        # Production environment
├── deploy.sh                  # Bash deployment script
├── deploy.ps1                 # PowerShell deployment script
├── deploy-apps.sh             # Bash app deployment script
├── deploy-apps.ps1            # PowerShell app deployment script
└── README.md                  # This file
```

## Prerequisites

1. **Azure CLI**: Install and login to Azure

   ```bash
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Bicep CLI**: Install Bicep extension for Azure CLI

   ```bash
   az bicep install
   ```

3. **Container Images**: Build and push your application containers

   ```bash
   # Build images
   docker build -t houseservice:latest ./HouseService
   docker build -t temperatureservice:latest ./TemperatureService

   # Tag and push to Azure Container Registry (after infrastructure deployment)
   docker tag houseservice:latest <registry>.azurecr.io/houseservice:latest
   docker tag temperatureservice:latest <registry>.azurecr.io/temperatureservice:latest
   docker push <registry>.azurecr.io/houseservice:latest
   docker push <registry>.azurecr.io/temperatureservice:latest
   ```

## Deployment Process

### Step 1: Deploy Infrastructure

Choose your preferred method:

**Using PowerShell (Windows):**

```powershell
cd infrastructure
.\deploy.ps1 -Environment dev -ResourceGroup rg-houseproject-dev
```

**Using Bash (Linux/macOS/WSL):**

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh dev rg-houseproject-dev
```

**Manual deployment with Azure CLI:**

```bash
# Create resource group
az group create --name rg-houseproject-dev --location eastus

# Deploy infrastructure
az deployment group create \
    --resource-group rg-houseproject-dev \
    --template-file main.bicep \
    --parameters parameters/dev.bicepparam \
    --name infrastructure-deployment
```

### Step 2: Build and Push Container Images

After infrastructure deployment, you'll get a Container Registry URL. Use it to push your images:

```bash
# Login to the registry
az acr login --name <registry-name>

# Build and push images
docker build -t <registry>.azurecr.io/houseservice:v1.0.0 ./HouseService
docker build -t <registry>.azurecr.io/temperatureservice:v1.0.0 ./TemperatureService

docker push <registry>.azurecr.io/houseservice:v1.0.0
docker push <registry>.azurecr.io/temperatureservice:v1.0.0
```

### Step 3: Deploy Applications

**Using PowerShell:**

```powershell
.\deploy-apps.ps1 -Environment dev -ImageTag v1.0.0
```

**Using Bash:**

```bash
./deploy-apps.sh dev v1.0.0
```

## Environment Configuration

### Development Environment

- Simplified security for testing
- Single region deployment
- Basic scaling configuration
- Hardcoded secrets (for development only)

### Staging Environment

- Production-like configuration
- Enhanced monitoring
- Auto-scaling enabled
- Secrets from Key Vault recommended

### Production Environment

- High availability setup
- Advanced security configurations
- Multi-region deployment capability
- All secrets must come from Key Vault or CI/CD pipeline variables

## Security Considerations

### Secrets Management

- **Development**: Secrets can be in parameter files (not recommended for production)
- **Staging/Production**: Use Azure Key Vault or CI/CD pipeline variables
- **Never commit production secrets to source control**

### Network Security

- Container Apps are configured with HTTPS-only ingress
- Private endpoints can be configured for enhanced security
- Service-to-service communication uses internal service discovery

### Database Security

- PostgreSQL servers with SSL enforcement
- Firewall rules configured for Azure services
- Admin credentials stored in Key Vault

## Monitoring and Logging

### Application Insights

- Automatic telemetry collection
- Custom metrics and traces
- Performance monitoring
- Dependency tracking

### Log Analytics

- Centralized log collection
- Container Apps system logs
- Application logs
- Query capabilities with KQL

### Health Checks

- Container Apps health probes
- Service availability monitoring
- Automatic restart on failures

## Scaling Configuration

### Auto-scaling Rules

- HTTP request-based scaling
- CPU and memory-based scaling
- Min/max replica configuration
- Scale-to-zero capability

### Resource Limits

- CPU: 0.5 cores per container
- Memory: 1Gi per container
- Configurable based on environment

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy Infrastructure
        run: |
          cd infrastructure
          ./deploy.sh prod rg-houseproject-prod

      - name: Build and Push Images
        run: |
          # Build and push container images

      - name: Deploy Applications
        run: |
          cd infrastructure
          ./deploy-apps.sh prod ${{ github.sha }}
```

### Azure DevOps Pipeline

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: "ubuntu-latest"

stages:
  - stage: Deploy
    jobs:
      - job: DeployInfrastructure
        steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: "Azure Service Connection"
              scriptType: "bash"
              scriptLocation: "scriptPath"
              scriptPath: "infrastructure/deploy.sh"
              arguments: "prod rg-houseproject-prod"
```

## Troubleshooting

### Common Issues

1. **Container Registry Access Denied**

   - Ensure you're logged in: `az acr login --name <registry>`
   - Check RBAC permissions

2. **Container Apps Not Starting**

   - Check container logs: `az containerapp logs show --name <app> --resource-group <rg>`
   - Verify environment variables and secrets

3. **Database Connection Failures**

   - Verify connection strings in Key Vault
   - Check PostgreSQL firewall rules
   - Ensure SSL is properly configured

4. **Service-to-Service Communication Issues**
   - Verify service URLs are correctly configured
   - Check Container Apps environment networking
   - Validate API key configuration

### Useful Commands

```bash
# Check deployment status
az deployment group show --name <deployment> --resource-group <rg>

# View container app logs
az containerapp logs show --name <app> --resource-group <rg> --follow

# List container apps
az containerapp list --resource-group <rg> --output table

# Get service URLs
az containerapp show --name <app> --resource-group <rg> --query properties.configuration.ingress.fqdn

# Check database status
az postgres flexible-server show --name <server> --resource-group <rg>
```

## Cost Optimization

### Development Environment

- Use consumption-based pricing
- Scale to zero when not in use
- Smaller database SKUs
- Single availability zone

### Production Environment

- Consider reserved instances for databases
- Use appropriate SKUs based on actual usage
- Implement proper scaling policies
- Monitor costs with Azure Cost Management

## Support and Maintenance

### Regular Tasks

- Monitor application performance
- Review and rotate secrets
- Update container images
- Apply security patches
- Review scaling metrics

### Backup and Recovery

- Database automated backups enabled
- Container images versioned and tagged
- Infrastructure as Code for disaster recovery
- Application Insights data retention configured

For more information, see the [Azure Container Apps documentation](https://docs.microsoft.com/en-us/azure/container-apps/) and [Azure Bicep documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/).
