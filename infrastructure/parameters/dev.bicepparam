using '../main.bicep'

param environment = 'dev'
param location = 'East US'
param baseName = 'houseproject'
param postgresAdminLogin = 'houseadmin'
param postgresAdminPassword = 'P@ssw0rd123!'  // Change this in production
param apiKeys = 'dev-api-key-123'  // Change this in production
