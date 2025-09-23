using '../main.bicep'

param environment = 'prod'
param location = 'East US'
param baseName = 'houseproject'
param postgresAdminLogin = 'houseadmin'
param postgresAdminPassword = '$(POSTGRES_ADMIN_PASSWORD)'  // Should be injected from CI/CD pipeline
param apiKeys = '$(API_KEYS)'  // Should be injected from CI/CD pipeline
