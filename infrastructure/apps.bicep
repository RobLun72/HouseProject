@description('The name of the environment (e.g., dev, staging, prod)')
param environment string = 'dev'

@description('The Azure region for deployment')
param location string = resourceGroup().location

@description('The base name for all resources')
param baseName string = 'houseproject'

@description('The Container Registry login server')
param containerRegistryLoginServer string

@description('The Container Registry username')
@secure()
param containerRegistryUsername string

@description('The Container Registry password')
@secure()
param containerRegistryPassword string

@description('The Container App Environment resource ID')
param containerAppEnvironmentId string

@description('The Container App Environment default domain')
param containerAppEnvironmentDomain string

@description('The PostgreSQL connection strings')
@secure()
param houseDbConnectionString string

@secure()
param temperatureDbConnectionString string

@description('The Service Bus connection string')
@secure()
param serviceBusConnectionString string

@description('The API keys for the services')
@secure()
param apiKeys string

@description('The Application Insights connection string')
param applicationInsightsConnectionString string

@description('The image tag for deployment')
param imageTag string = 'latest'

// Variables
var resourceNamePrefix = '${baseName}-${environment}'
var tags = {
  Environment: environment
  Project: 'HouseProject'
  ManagedBy: 'Bicep'
}

// House Service Container App
resource houseServiceApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${resourceNamePrefix}-house-service'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      secrets: [
        {
          name: 'container-registry-password'
          value: containerRegistryPassword
        }
        {
          name: 'db-connection-string'
          value: houseDbConnectionString
        }
        {
          name: 'servicebus-connection-string'
          value: serviceBusConnectionString
        }
        {
          name: 'api-keys'
          value: apiKeys
        }
      ]
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'container-registry-password'
        }
      ]
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/houseservice:${imageTag}'
          name: 'house-service'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              secretRef: 'db-connection-string'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection-string'
            }
            {
              name: 'ApiKeys__0'
              secretRef: 'api-keys'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: applicationInsightsConnectionString
            }
            {
              name: 'Services__TemperatureService__BaseUrl'
              value: 'https://${resourceNamePrefix}-temperature-service.${containerAppEnvironmentDomain}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaler'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Temperature Service Container App
resource temperatureServiceApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${resourceNamePrefix}-temperature-service'
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      secrets: [
        {
          name: 'container-registry-password'
          value: containerRegistryPassword
        }
        {
          name: 'db-connection-string'
          value: temperatureDbConnectionString
        }
        {
          name: 'servicebus-connection-string'
          value: serviceBusConnectionString
        }
        {
          name: 'api-keys'
          value: apiKeys
        }
      ]
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryUsername
          passwordSecretRef: 'container-registry-password'
        }
      ]
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
    }
    template: {
      containers: [
        {
          image: '${containerRegistryLoginServer}/temperatureservice:${imageTag}'
          name: 'temperature-service'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ASPNETCORE_URLS'
              value: 'http://+:8080'
            }
            {
              name: 'ConnectionStrings__DefaultConnection'
              secretRef: 'db-connection-string'
            }
            {
              name: 'ServiceBus__ConnectionString'
              secretRef: 'servicebus-connection-string'
            }
            {
              name: 'ApiKeys__0'
              secretRef: 'api-keys'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: applicationInsightsConnectionString
            }
            {
              name: 'Services__HouseService__BaseUrl'
              value: 'https://${resourceNamePrefix}-house-service.${containerAppEnvironmentDomain}'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaler'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Outputs
output houseServiceUrl string = 'https://${houseServiceApp.properties.configuration.ingress.fqdn}'
output temperatureServiceUrl string = 'https://${temperatureServiceApp.properties.configuration.ingress.fqdn}'
output houseServiceFqdn string = houseServiceApp.properties.configuration.ingress.fqdn
output temperatureServiceFqdn string = temperatureServiceApp.properties.configuration.ingress.fqdn
