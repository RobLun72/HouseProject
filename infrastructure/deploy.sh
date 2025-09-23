#!/bin/bash

# Azure Infrastructure Deployment Script
# Usage: ./deploy.sh <environment> <resource-group>
# Example: ./deploy.sh dev rg-houseproject-dev

set -e  # Exit on any error

ENVIRONMENT=${1:-dev}
RESOURCE_GROUP=${2:-rg-houseproject-$ENVIRONMENT}
LOCATION=${3:-eastus}
SUBSCRIPTION_ID=${SUBSCRIPTION_ID}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Azure Infrastructure Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Resource Group: $RESOURCE_GROUP${NC}"
echo -e "${YELLOW}Location: $LOCATION${NC}"

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Please login to Azure using 'az login'${NC}"
    exit 1
fi

# Create resource group if it doesn't exist
echo -e "${YELLOW}Creating resource group if it doesn't exist...${NC}"
az group create --name $RESOURCE_GROUP --location $LOCATION --output none

# Deploy infrastructure
echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
DEPLOYMENT_NAME="main-deployment-$(date +%Y%m%d-%H%M%S)"

# Check if parameter file exists
PARAM_FILE="./parameters/${ENVIRONMENT}.bicepparam"
if [ ! -f "$PARAM_FILE" ]; then
    echo -e "${RED}❌ Parameter file not found: $PARAM_FILE${NC}"
    exit 1
fi

az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file ./main.bicep \
    --parameters $PARAM_FILE \
    --name $DEPLOYMENT_NAME \
    --output table

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
    
    # Get deployment outputs
    echo -e "${YELLOW}📋 Getting deployment outputs...${NC}"
    CONTAINER_REGISTRY=$(az deployment group show \
        --resource-group $RESOURCE_GROUP \
        --name $DEPLOYMENT_NAME \
        --query 'properties.outputs.containerRegistryLoginServer.value' \
        --output tsv)
    
    CONTAINER_APP_ENV_ID=$(az deployment group show \
        --resource-group $RESOURCE_GROUP \
        --name $DEPLOYMENT_NAME \
        --query 'properties.outputs.containerAppEnvironmentId.value' \
        --output tsv)
    
    CONTAINER_APP_ENV_DOMAIN=$(az deployment group show \
        --resource-group $RESOURCE_GROUP \
        --name $DEPLOYMENT_NAME \
        --query 'properties.outputs.containerAppEnvironmentDomain.value' \
        --output tsv)
    
    echo -e "${GREEN}📦 Container Registry: $CONTAINER_REGISTRY${NC}"
    echo -e "${GREEN}🏠 Container App Environment: $CONTAINER_APP_ENV_DOMAIN${NC}"
    
    # Save outputs to file for CI/CD pipeline
    cat > deployment-outputs.json << EOF
{
    "containerRegistryLoginServer": "$CONTAINER_REGISTRY",
    "containerAppEnvironmentId": "$CONTAINER_APP_ENV_ID",
    "containerAppEnvironmentDomain": "$CONTAINER_APP_ENV_DOMAIN",
    "resourceGroup": "$RESOURCE_GROUP",
    "environment": "$ENVIRONMENT"
}
EOF
    
    echo -e "${GREEN}💾 Deployment outputs saved to deployment-outputs.json${NC}"
    echo -e "${GREEN}🎉 Ready for application deployment!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Build and push container images to: $CONTAINER_REGISTRY"
    echo -e "  2. Deploy applications using: ./deploy-apps.sh $ENVIRONMENT"
    
else
    echo -e "${RED}❌ Infrastructure deployment failed!${NC}"
    exit 1
fi