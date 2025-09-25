# Frontend Environment Setup

This frontend application connects to the HouseService API. You need to configure environment variables for the API connection.

## Environment Variables Setup

1. **Copy the example environment file:**

   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your actual values:**
   ```
   VITE_HOUSE_API_URL=https://localhost:7001
   VITE_HOUSE_API_KEY=your-actual-api-key
   ```

## Configuration for Different Environments

### Local Development (Docker)

If you're running the HouseService via Docker Compose:

```
VITE_HOUSE_API_URL=https://localhost:7001
VITE_HOUSE_API_KEY=dev-api-key-123
```

### Azure Container Apps

If you're connecting to Azure-deployed services:

```
VITE_HOUSE_API_URL=https://your-house-service-url.azurecontainerapps.io
VITE_HOUSE_API_KEY=your-production-api-key
```

## Important Notes

- The API Key must match the key configured in your HouseService
- The API URL should be the base URL without any path (the controller routes are added by the frontend)
- Environment variables in Vite must be prefixed with `VITE_` to be accessible in the browser
- The `.env.local` file is ignored by git for security

## API Connection Details

The frontend connects to the following HouseService endpoint:

- **GET /House** - Retrieves all houses with their details (ID, Name, Address, Area)

## Security

- API keys are included in the frontend bundle and visible to users
- Consider implementing proper authentication (OAuth, JWT) for production
- Never commit actual API keys to version control
