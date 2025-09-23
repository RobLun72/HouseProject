#!/bin/bash

# Azure Container Apps Deployment Script
# Usage: ./deploy-apps.sh <environment> [image-tag]
# Example: ./deploy-apps.sh dev v1.0.0

set -e  # Exit on any error

ENVIRONMENT=${1:-dev}
IMAGE_TAG=${2:-latest}
OUTPUTS_FILE="deployment-outputs.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Container Apps Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Image Tag: $IMAGE_TAG${NC}"

# Check if deployment outputs file exists
if [ ! -f "$OUTPUTS_FILE" ]; then
    echo -e "${RED}❌ Deployment outputs file not found: $OUTPUTS_FILE${NC}"
    echo -e "${YELLOW}Please run infrastructure deployment first: ./deploy.sh $ENVIRONMENT${NC}"
    exit 1
fi

# Read deployment outputs
RESOURCE_GROUP=$(jq -r '.resourceGroup' $OUTPUTS_FILE)
CONTAINER_REGISTRY=$(jq -r '.containerRegistryLoginServer' $OUTPUTS_FILE)
CONTAINER_APP_ENV_ID=$(jq -r '.containerAppEnvironmentId' $OUTPUTS_FILE)
CONTAINER_APP_ENV_DOMAIN=$(jq -r '.containerAppEnvironmentDomain' $OUTPUTS_FILE)

echo -e "${YELLOW}Resource Group: $RESOURCE_GROUP${NC}"
echo -e "${YELLOW}Container Registry: $CONTAINER_REGISTRY${NC}"

# Get container registry credentials
echo -e "${YELLOW}🔑 Getting container registry credentials...${NC}"
REGISTRY_USERNAME=$(az acr credential show --name ${CONTAINER_REGISTRY%.*} --query 'username' --output tsv)
REGISTRY_PASSWORD=$(az acr credential show --name ${CONTAINER_REGISTRY%.*} --query 'passwords[0].value' --output tsv)

# Get database connection strings from Key Vault
echo -e "${YELLOW}🔐 Retrieving secrets from Key Vault...${NC}"
KEY_VAULT_NAME="kv-houseproject-$ENVIRONMENT-$(echo $RANDOM | md5sum | head -c 6)"  # This should match the actual Key Vault name
HOUSE_DB_CONNECTION=$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name "house-db-connection" --query 'value' --output tsv 2>/dev/null || echo "")
TEMPERATURE_DB_CONNECTION=$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name "temperature-db-connection" --query 'value' --output tsv 2>/dev/null || echo "")
SERVICE_BUS_CONNECTION=$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name "servicebus-connection" --query 'value' --output tsv 2>/dev/null || echo "")
API_KEYS=$(az keyvault secret show --vault-name $KEY_VAULT_NAME --name "api-keys" --query 'value' --output tsv 2>/dev/null || echo "default-api-key")

# If secrets are not in Key Vault, use parameter values (for dev environment)
if [ -z "$HOUSE_DB_CONNECTION" ]; then
    echo -e "${YELLOW}⚠️  Secrets not found in Key Vault, using parameter file values for development${NC}"
    # You would need to construct connection strings or get them from deployment outputs
    # This is a simplified approach for development
    API_KEYS="dev-api-key-123"
fi

# Get Application Insights connection string
AI_CONNECTION=$(az monitor app-insights component show \
    --app "ai-houseproject-$ENVIRONMENT" \
    --resource-group $RESOURCE_GROUP \
    --query 'connectionString' \
    --output tsv 2>/dev/null || echo "")

# Deploy Container Apps
echo -e "${YELLOW}📦 Deploying Container Apps...${NC}"
APPS_DEPLOYMENT_NAME="apps-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file ./apps.bicep \
    --parameters \
        environment=$ENVIRONMENT \
        containerRegistryLoginServer=$CONTAINER_REGISTRY \
        containerRegistryUsername=$REGISTRY_USERNAME \
        containerRegistryPassword=$REGISTRY_PASSWORD \
        containerAppEnvironmentId=$CONTAINER_APP_ENV_ID \
        containerAppEnvironmentDomain=$CONTAINER_APP_ENV_DOMAIN \
        houseDbConnectionString="$HOUSE_DB_CONNECTION" \
        temperatureDbConnectionString="$TEMPERATURE_DB_CONNECTION" \
        serviceBusConnectionString="$SERVICE_BUS_CONNECTION" \
        apiKeys="$API_KEYS" \
        applicationInsightsConnectionString="$AI_CONNECTION" \
        imageTag=$IMAGE_TAG \
    --name $APPS_DEPLOYMENT_NAME \
    --output table

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container Apps deployment completed successfully!${NC}"
    
    # Get service URLs
    HOUSE_SERVICE_URL=$(az deployment group show \
        --resource-group $RESOURCE_GROUP \
        --name $APPS_DEPLOYMENT_NAME \
        --query 'properties.outputs.houseServiceUrl.value' \
        --output tsv)
    
    TEMPERATURE_SERVICE_URL=$(az deployment group show \
        --resource-group $RESOURCE_GROUP \
        --name $APPS_DEPLOYMENT_NAME \
        --query 'properties.outputs.temperatureServiceUrl.value' \
        --output tsv)
    
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo -e "${GREEN}🏠 House Service URL: $HOUSE_SERVICE_URL${NC}"
    echo -e "${GREEN}🌡️  Temperature Service URL: $TEMPERATURE_SERVICE_URL${NC}"
    echo -e "${YELLOW}🔍 You can test the APIs using the provided URLs${NC}"
    
else
    echo -e "${RED}❌ Container Apps deployment failed!${NC}"
    exit 1
fi