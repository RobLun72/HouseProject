using '../main.bicep'

param environment = 'staging'
param location = 'East US'
param baseName = 'houseproject'
param postgresAdminLogin = 'houseadmin'
param postgresAdminPassword = 'P@ssw0rd456!'  // Use Azure Key Vault in production
param apiKeys = 'staging-api-key-456'  // Use Azure Key Vault in production
