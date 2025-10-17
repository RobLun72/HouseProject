# OAuth Integration for HouseProject

## Overview

This document describes how to integrate OAuth 2.0 / OpenID Connect authentication into the HouseProject microservices architecture to replace static API keys with secure, user-scoped access tokens and dynamic API key provisioning.

## Current State vs OAuth-Enabled Architecture

### Current Authentication Model

- Static API keys (`X-Api-Key` header) configured in environment variables
- Shared keys between frontend and backend services
- No user-specific access control or audit trails
- Manual key rotation and distribution

### Target OAuth Model

- OAuth 2.0 Authorization Code Flow with PKCE for frontend authentication
- JWT access tokens for API authorization
- User-scoped API keys dynamically provisioned after successful OAuth login
- Centralized identity provider (Azure AD, Auth0, Keycloak, etc.)
- Automatic token refresh and secure key distribution

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     OAuth Flow Architecture                     │
└─────────────────────────────────────────────────────────────────┘

    Frontend (React)           OAuth Provider          Backend Services
         │                    (Azure AD/Auth0)           (House/Temp)
         │                                                     │
    ┌────▼────┐               ┌─────────────┐            ┌─────▼─────┐
    │ User    │──────────────►│   Login     │            │    API    │
    │ Clicks  │               │   Redirect  │            │ Gateway   │
    │ Login   │               └─────────────┘            │(Optional) │
    └─────────┘                       │                  └───────────┘
         │                           │                         │
    ┌────▼────┐               ┌─────▼─────┐              ┌─────▼─────┐
    │Auth Code│◄──────────────│User Grants│              │   Auth    │
    │Received │               │Permission │              │ Middleware│
    └─────────┘               └───────────┘              └───────────┘
         │                                                      │
    ┌────▼────┐               ┌─────────────┐            ┌─────▼─────┐
    │Exchange │──────────────►│    Token    │            │   User    │
    │Code for │               │  Endpoint   │            │ Context & │
    │Tokens   │               └─────────────┘            │API Keys   │
    └─────────┘                       │                  └───────────┘
         │                           │                         │
    ┌────▼────┐               ┌─────▼─────┐              ┌─────▼─────┐
    │Access   │               │   JWT     │              │Protected  │
    │Token +  │               │ Access    │──────────────►│API Calls  │
    │API Keys │               │  Token    │              │w/ Tokens  │
    └─────────┘               └───────────┘              └───────────┘
```

## Detailed Implementation Plan

### Phase 1: OAuth Provider Setup

#### 1.1 Choose OAuth Provider

**Recommended Options:**

- **Azure AD B2C** (if using Azure infrastructure)
  - Integrated with existing Azure services
  - Built-in user management and social login
  - Seamless Key Vault integration
- **Auth0** (vendor-agnostic)
  - Rich feature set and developer experience
  - Extensive customization options
  - Multiple social and enterprise connectors
- **Keycloak** (self-hosted)
  - Open-source and fully controllable
  - Good for on-premises or hybrid deployments

#### 1.2 Application Registration

**Frontend Application (React SPA):**

```json
{
  "client_id": "houseproject-frontend",
  "client_type": "public",
  "grant_types": ["authorization_code"],
  "response_types": ["code"],
  "redirect_uris": [
    "http://localhost:3000/callback",
    "https://houseproject.yourdomain.com/callback"
  ],
  "post_logout_redirect_uris": [
    "http://localhost:3000/",
    "https://houseproject.yourdomain.com/"
  ],
  "scopes": ["openid", "profile", "email", "houseproject:api"]
}
```

**Backend Services (Machine-to-Machine):**

```json
{
  "client_id": "houseproject-backend",
  "client_type": "confidential",
  "client_secret": "secure-generated-secret",
  "grant_types": ["client_credentials"],
  "scopes": ["houseproject:internal"]
}
```

#### 1.3 Custom Scopes and Claims

**Define Application-Specific Scopes:**

```json
{
  "scopes": [
    {
      "name": "houseproject:houses:read",
      "description": "Read house information"
    },
    {
      "name": "houseproject:houses:write",
      "description": "Create and modify houses"
    },
    {
      "name": "houseproject:temperatures:read",
      "description": "Read temperature data"
    },
    {
      "name": "houseproject:temperatures:write",
      "description": "Record temperature readings"
    },
    {
      "name": "houseproject:admin",
      "description": "Administrative access to all resources"
    }
  ]
}
```

**Custom Claims in JWT Token:**

```json
{
  "sub": "user-12345",
  "email": "user@example.com",
  "name": "John Doe",
  "houseproject_user_id": "hp-user-67890",
  "houseproject_api_key": "uk-abc123def456ghi789",
  "roles": ["house_owner", "temperature_reader"],
  "scope": "openid profile houseproject:houses:read houseproject:temperatures:read"
}
```

### Phase 2: Frontend Integration (React)

#### 2.1 OAuth Library Integration

**Install Dependencies:**

```bash
npm install @auth0/auth0-react
# OR for Azure AD
npm install @azure/msal-react @azure/msal-browser
# OR for generic OAuth
npm install react-oauth2-pkce
```

**Auth Context Provider (Auth0 example):**

```typescript
// src/auth/AuthProvider.tsx
import { Auth0Provider } from "@auth0/auth0-react";

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope:
          "openid profile email houseproject:houses:read houseproject:temperatures:read",
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
};
```

#### 2.2 Authentication Hook

```typescript
// src/auth/useAuthApi.ts
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

interface ApiCredentials {
  accessToken: string;
  apiKey: string;
  userId: string;
}

export const useAuthApi = () => {
  const { isAuthenticated, getAccessTokenSilently, user, logout } = useAuth0();
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);

  useEffect(() => {
    const getCredentials = async () => {
      if (isAuthenticated) {
        try {
          // Get access token with custom claims
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: "openid profile houseproject:api",
            },
          });

          // Decode JWT to extract API key and user info
          const payload = JSON.parse(atob(token.split(".")[1]));

          setCredentials({
            accessToken: token,
            apiKey: payload.houseproject_api_key,
            userId: payload.houseproject_user_id,
          });
        } catch (error) {
          console.error("Failed to get credentials:", error);
        }
      }
    };

    getCredentials();
  }, [isAuthenticated, getAccessTokenSilently]);

  return {
    isAuthenticated,
    credentials,
    user,
    logout,
  };
};
```

#### 2.3 API Client with OAuth

```typescript
// src/api/apiClient.ts
import { useAuthApi } from "../auth/useAuthApi";

class AuthenticatedApiClient {
  private baseUrl: string;
  private credentials: ApiCredentials | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setCredentials(credentials: ApiCredentials | null) {
    this.credentials = credentials;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.credentials) {
      // Use OAuth access token as primary auth
      headers["Authorization"] = `Bearer ${this.credentials.accessToken}`;

      // Include API key as fallback/additional auth
      headers["X-Api-Key"] = this.credentials.apiKey;

      // Include user context
      headers["X-User-Id"] = this.credentials.userId;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Handle token expiry - trigger re-authentication
        throw new Error("Authentication required");
      }
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Hook for using authenticated API client
export const useApiClient = () => {
  const { credentials } = useAuthApi();
  const [houseClient] = useState(
    () => new AuthenticatedApiClient(import.meta.env.VITE_HOUSE_API_URL)
  );
  const [temperatureClient] = useState(
    () => new AuthenticatedApiClient(import.meta.env.VITE_TEMPERATURE_API_URL)
  );

  useEffect(() => {
    houseClient.setCredentials(credentials);
    temperatureClient.setCredentials(credentials);
  }, [credentials, houseClient, temperatureClient]);

  return { houseClient, temperatureClient };
};
```

### Phase 3: Backend Integration

#### 3.1 JWT Middleware for .NET Services

**Install NuGet Packages:**

```xml
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="7.0.0" />
```

**JWT Authentication Setup:**

```csharp
// Program.cs additions
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["OAuth:Authority"]; // e.g., "https://yourtenant.auth0.com/"
        options.Audience = builder.Configuration["OAuth:Audience"];   // e.g., "https://api.houseproject.com"

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(2), // Allow small clock differences

            // Custom claim mapping
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = "roles"
        };

        // Handle token events
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                // Extract custom claims and add to user identity
                var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                var apiKey = context.Principal?.FindFirst("houseproject_api_key")?.Value;
                var userId = context.Principal?.FindFirst("houseproject_user_id")?.Value;

                if (!string.IsNullOrEmpty(apiKey))
                {
                    claimsIdentity?.AddClaim(new Claim("api_key", apiKey));
                }

                if (!string.IsNullOrEmpty(userId))
                {
                    claimsIdentity?.AddClaim(new Claim("user_id", userId));
                }

                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                // Log authentication failures
                var logger = context.HttpContext.RequestServices.GetService<ILogger<Program>>();
                logger?.LogWarning("JWT authentication failed: {Error}", context.Exception.Message);
                return Task.CompletedTask;
            }
        };
    });

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("HouseRead", policy =>
        policy.RequireScope("houseproject:houses:read"));

    options.AddPolicy("HouseWrite", policy =>
        policy.RequireScope("houseproject:houses:write"));

    options.AddPolicy("TemperatureRead", policy =>
        policy.RequireScope("houseproject:temperatures:read"));

    options.AddPolicy("TemperatureWrite", policy =>
        policy.RequireScope("houseproject:temperatures:write"));

    options.AddPolicy("Admin", policy =>
        policy.RequireScope("houseproject:admin"));
});

// Enable authentication and authorization
app.UseAuthentication();
app.UseAuthorization();
```

#### 3.2 Enhanced Authentication Attribute

```csharp
// Attributes/JwtOrApiKeyAuthAttribute.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

public class JwtOrApiKeyAuthAttribute : Attribute, IAuthorizationFilter
{
    private readonly string? _requiredScope;
    private readonly string _fallbackApiKeyConfigKey;

    public JwtOrApiKeyAuthAttribute(string? requiredScope = null, string fallbackApiKeyConfigKey = "Authentication:ApiKey")
    {
        _requiredScope = requiredScope;
        _fallbackApiKeyConfigKey = fallbackApiKeyConfigKey;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // Check if user is authenticated via JWT
        if (user.Identity?.IsAuthenticated == true)
        {
            // Validate required scope if specified
            if (!string.IsNullOrEmpty(_requiredScope))
            {
                var scopes = user.FindFirst("scope")?.Value?.Split(' ') ?? Array.Empty<string>();
                if (!scopes.Contains(_requiredScope))
                {
                    context.Result = new ForbidResult("Insufficient scope");
                    return;
                }
            }

            // Add user context to HttpContext items for easy access
            var userId = user.FindFirst("user_id")?.Value;
            var apiKey = user.FindFirst("api_key")?.Value;

            context.HttpContext.Items["UserId"] = userId;
            context.HttpContext.Items["UserApiKey"] = apiKey;

            return; // JWT auth successful
        }

        // Fallback to API key authentication
        var configuration = context.HttpContext.RequestServices.GetService<IConfiguration>();
        var expectedApiKey = configuration?[_fallbackApiKeyConfigKey];

        if (string.IsNullOrEmpty(expectedApiKey))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var providedApiKey = context.HttpContext.Request.Headers["X-Api-Key"].FirstOrDefault();

        if (string.IsNullOrEmpty(providedApiKey) || providedApiKey != expectedApiKey)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // API key auth successful - create minimal user context
        context.HttpContext.Items["UserId"] = "api-key-user";
        context.HttpContext.Items["UserApiKey"] = providedApiKey;
    }
}

// Extension method for scope requirement
public static class AuthorizationPolicyBuilderExtensions
{
    public static AuthorizationPolicyBuilder RequireScope(this AuthorizationPolicyBuilder builder, string scope)
    {
        return builder.RequireAssertion(context =>
        {
            var scopes = context.User.FindFirst("scope")?.Value?.Split(' ') ?? Array.Empty<string>();
            return scopes.Contains(scope);
        });
    }
}
```

#### 3.3 Updated Controller with OAuth Support

```csharp
// Controllers/HouseController.cs
[ApiController]
[Route("api/[controller]")]
public class HouseController : ControllerBase
{
    private readonly ILogger<HouseController> _logger;
    private readonly HouseDbContext _context;

    public HouseController(ILogger<HouseController> logger, HouseDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    [HttpGet]
    [JwtOrApiKeyAuth("houseproject:houses:read")]
    public async Task<ActionResult<IEnumerable<House>>> GetHouses()
    {
        var userId = HttpContext.Items["UserId"]?.ToString();
        _logger.LogInformation("User {UserId} requested houses list", userId);

        // Optional: Filter houses by user ownership if multi-tenant
        var houses = await _context.Houses
            .Include(h => h.Rooms)
            .ToListAsync();

        return Ok(houses);
    }

    [HttpPost]
    [JwtOrApiKeyAuth("houseproject:houses:write")]
    public async Task<ActionResult<House>> CreateHouse([FromBody] CreateHouseRequest request)
    {
        var userId = HttpContext.Items["UserId"]?.ToString();
        _logger.LogInformation("User {UserId} creating new house: {HouseName}", userId, request.Name);

        var house = new House
        {
            Name = request.Name,
            Address = request.Address,
            Area = request.Area,
            CreatedBy = userId, // Track who created the house
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Houses.Add(house);
        await _context.SaveChangesAsync();

        // Publish house created event with user context
        await PublishHouseCreatedEvent(house, userId);

        return CreatedAtAction(nameof(GetHouse), new { id = house.Id }, house);
    }

    // Additional methods with appropriate scope requirements...
}
```

### Phase 4: API Key Management Service

#### 4.1 Dynamic API Key Provisioning

```csharp
// Services/IApiKeyService.cs
public interface IApiKeyService
{
    Task<string> GenerateApiKeyForUserAsync(string userId, string[] scopes);
    Task<bool> ValidateApiKeyAsync(string apiKey, string requiredScope);
    Task<string?> GetUserIdFromApiKeyAsync(string apiKey);
    Task RevokeApiKeyAsync(string userId, string apiKey);
    Task<IEnumerable<string>> GetActiveApiKeysForUserAsync(string userId);
}

// Services/ApiKeyService.cs
public class ApiKeyService : IApiKeyService
{
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ApiKeyService> _logger;

    // In production, use a dedicated database table or Redis
    private readonly Dictionary<string, ApiKeyInfo> _apiKeys = new();

    public ApiKeyService(IConfiguration configuration, IMemoryCache cache, ILogger<ApiKeyService> logger)
    {
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string> GenerateApiKeyForUserAsync(string userId, string[] scopes)
    {
        var apiKey = $"uk_{Guid.NewGuid():N}_{Convert.ToBase64String(Encoding.UTF8.GetBytes(userId))[..8]}";

        var keyInfo = new ApiKeyInfo
        {
            ApiKey = apiKey,
            UserId = userId,
            Scopes = scopes,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30), // 30-day expiry
            IsActive = true
        };

        _apiKeys[apiKey] = keyInfo;

        // Cache for quick lookup
        _cache.Set($"apikey_{apiKey}", keyInfo, TimeSpan.FromHours(1));

        _logger.LogInformation("Generated API key for user {UserId} with scopes: {Scopes}",
            userId, string.Join(", ", scopes));

        return apiKey;
    }

    public async Task<bool> ValidateApiKeyAsync(string apiKey, string requiredScope)
    {
        var keyInfo = _cache.Get<ApiKeyInfo>($"apikey_{apiKey}") ??
                      _apiKeys.GetValueOrDefault(apiKey);

        if (keyInfo == null || !keyInfo.IsActive || keyInfo.ExpiresAt < DateTime.UtcNow)
        {
            return false;
        }

        return keyInfo.Scopes.Contains(requiredScope) || keyInfo.Scopes.Contains("houseproject:admin");
    }

    public async Task<string?> GetUserIdFromApiKeyAsync(string apiKey)
    {
        var keyInfo = _cache.Get<ApiKeyInfo>($"apikey_{apiKey}") ??
                      _apiKeys.GetValueOrDefault(apiKey);

        return keyInfo?.UserId;
    }

    // Additional implementation methods...
}

public class ApiKeyInfo
{
    public string ApiKey { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string[] Scopes { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
}
```

#### 4.2 OAuth Claims Transformation

```csharp
// Services/ClaimsTransformationService.cs
public class ClaimsTransformationService : IClaimsTransformation
{
    private readonly IApiKeyService _apiKeyService;
    private readonly ILogger<ClaimsTransformationService> _logger;

    public ClaimsTransformationService(IApiKeyService apiKeyService, ILogger<ClaimsTransformationService> logger)
    {
        _apiKeyService = apiKeyService;
        _logger = logger;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
        {
            return principal;
        }

        var claimsIdentity = principal.Identity as ClaimsIdentity;
        var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var existingApiKey = principal.FindFirst("houseproject_api_key")?.Value;

        // Generate API key if not present in token
        if (string.IsNullOrEmpty(existingApiKey) && !string.IsNullOrEmpty(userId))
        {
            try
            {
                var scopes = principal.FindFirst("scope")?.Value?.Split(' ') ?? Array.Empty<string>();
                var apiKey = await _apiKeyService.GenerateApiKeyForUserAsync(userId, scopes);

                claimsIdentity?.AddClaim(new Claim("api_key", apiKey));
                claimsIdentity?.AddClaim(new Claim("user_id", userId));

                _logger.LogInformation("Generated API key for user {UserId} during claims transformation", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate API key for user {UserId}", userId);
            }
        }

        return principal;
    }
}
```

### Phase 5: Security Considerations

#### 5.1 Token Storage and Security

**Frontend Security Measures:**

```typescript
// src/auth/secureStorage.ts
class SecureTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = "hp_access_token";
  private static readonly REFRESH_TOKEN_KEY = "hp_refresh_token";
  private static readonly API_KEY_KEY = "hp_api_key";

  // Store tokens securely
  static storeTokens(
    accessToken: string,
    refreshToken: string,
    apiKey: string
  ) {
    // Use httpOnly cookies for production, localStorage for development
    if (import.meta.env.PROD) {
      // Tokens should be handled by httpOnly cookies set by backend
      // Never store sensitive tokens in localStorage in production
      console.warn("Token storage should be handled server-side in production");
    } else {
      // Development only - clear previous tokens first
      this.clearTokens();

      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.API_KEY_KEY, apiKey);
      // Refresh token should never be stored in localStorage
    }
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_KEY);
  }

  static clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.API_KEY_KEY);
  }

  // Automatic token refresh
  static async refreshAccessToken(
    refreshToken: string
  ): Promise<string | null> {
    try {
      const response = await fetch("/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const tokens = await response.json();
        this.storeTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.api_key
        );
        return tokens.access_token;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return null;
  }
}
```

#### 5.2 Environment Configuration

**Environment Variables:**

```bash
# OAuth Provider Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://api.houseproject.com

# Backend OAuth Configuration
OAuth__Authority=https://your-tenant.auth0.com/
OAuth__Audience=https://api.houseproject.com
OAuth__ClientId=houseproject-backend
OAuth__ClientSecret=your-backend-client-secret

# Fallback API Keys (for migration period)
Authentication__ApiKey=fallback-static-key-for-migration
Authentication__HouseApiKey=house-service-fallback-key
Authentication__TemperatureApiKey=temperature-service-fallback-key
```

#### 5.3 Migration Strategy

**Phase-by-Phase Migration:**

```markdown
Phase 1: Parallel Authentication (Current + OAuth)

- Deploy OAuth-enabled backend with fallback to existing API keys
- Frontend can use either authentication method
- No breaking changes to existing deployments

Phase 2: OAuth-First with API Key Fallback

- Frontend defaults to OAuth authentication
- Static API keys still supported for legacy integrations
- Monitor OAuth adoption and resolve any issues

Phase 3: OAuth-Only (Remove API Key Fallback)

- Remove static API key support
- All authentication goes through OAuth provider
- API keys are dynamically generated and user-scoped
```

### Phase 6: Testing Strategy

#### 6.1 OAuth Integration Tests

```typescript
// src/test/auth/oauth.integration.test.ts
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "../../auth/AuthProvider";
import { useAuthApi } from "../../auth/useAuthApi";

// Mock OAuth provider for testing
const mockAuth0 = {
  isAuthenticated: true,
  user: {
    sub: "test-user-123",
    email: "test@example.com",
    name: "Test User",
  },
  getAccessTokenSilently: jest.fn().mockResolvedValue("mock-jwt-token"),
  logout: jest.fn(),
};

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: () => mockAuth0,
}));

describe("OAuth Integration", () => {
  test("should extract API key from JWT token", async () => {
    const TestComponent = () => {
      const { credentials } = useAuthApi();
      return (
        <div>
          <span data-testid="access-token">{credentials?.accessToken}</span>
          <span data-testid="api-key">{credentials?.apiKey}</span>
          <span data-testid="user-id">{credentials?.userId}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("access-token")).toHaveTextContent(
        "mock-jwt-token"
      );
      expect(screen.getByTestId("api-key")).toHaveTextContent("uk-"); // Should start with prefix
      expect(screen.getByTestId("user-id")).toHaveTextContent("hp-user-");
    });
  });

  test("should handle authentication failure gracefully", async () => {
    mockAuth0.getAccessTokenSilently.mockRejectedValueOnce(
      new Error("Token expired")
    );

    const TestComponent = () => {
      const { credentials } = useAuthApi();
      return (
        <span data-testid="auth-state">
          {credentials ? "authenticated" : "unauthenticated"}
        </span>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent(
        "unauthenticated"
      );
    });
  });
});
```

#### 6.2 Backend Authentication Tests

```csharp
// Tests/AuthenticationTests.cs
[TestClass]
public class AuthenticationTests : TestBase
{
    [TestMethod]
    public async Task Should_Accept_Valid_JWT_Token()
    {
        // Arrange
        var jwtToken = GenerateValidJwtToken("test-user", new[] { "houseproject:houses:read" });
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

        // Act
        var response = await _client.GetAsync("/api/houses");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [TestMethod]
    public async Task Should_Reject_Invalid_Scope_In_JWT()
    {
        // Arrange
        var jwtToken = GenerateValidJwtToken("test-user", new[] { "houseproject:temperatures:read" });
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", jwtToken);

        // Act
        var response = await _client.GetAsync("/api/houses"); // Requires houses:read scope

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [TestMethod]
    public async Task Should_Fallback_To_API_Key_When_No_JWT()
    {
        // Arrange
        _client.DefaultRequestHeaders.Add("X-Api-Key", "valid-fallback-key");

        // Act
        var response = await _client.GetAsync("/api/houses");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private string GenerateValidJwtToken(string userId, string[] scopes)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes("test-secret-key-32-characters-min");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim("scope", string.Join(" ", scopes)),
                new Claim("houseproject_user_id", $"hp-user-{userId}"),
                new Claim("houseproject_api_key", $"uk-test-{userId}")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = "test-issuer",
            Audience = "test-audience"
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
```

## Security Best Practices

### 1. Token Management

- **Access tokens**: Short-lived (15-60 minutes), used for API authorization
- **Refresh tokens**: Long-lived (days/weeks), stored securely, used only for token renewal
- **API keys**: User-scoped, regularly rotated, revocable per user
- **Transport**: Always HTTPS in production, secure cookie storage when possible

### 2. Scope-Based Authorization

- **Principle of least privilege**: Grant minimal scopes required for user role
- **Fine-grained scopes**: Separate read/write permissions per resource type
- **Administrative access**: Separate admin scopes for sensitive operations
- **Scope validation**: Verify scopes on every API request, not just authentication

### 3. Audit and Monitoring

- **Authentication events**: Log all login attempts, token renewals, failures
- **API access logs**: Include user ID, scopes, endpoint, timestamp
- **Security alerts**: Unusual access patterns, failed authentications, scope violations
- **Token lifecycle**: Track token issuance, renewal, revocation

### 4. Error Handling

- **Graceful degradation**: Fallback authentication methods during OAuth provider outages
- **User-friendly errors**: Clear messages for authentication failures without exposing internals
- **Retry logic**: Automatic token refresh, exponential backoff for transient failures
- **Secure logging**: Never log sensitive tokens or credentials

## Deployment Considerations

### 1. Development Environment

```bash
# Local OAuth setup with Auth0/Azure AD test tenant
docker-compose up -d
npm run dev
dotnet run --project HouseService
dotnet run --project TemperatureService
```

### 2. Production Environment

```yaml
# Azure Container Apps with managed identity
services:
  frontend:
    environment:
      - VITE_AUTH0_DOMAIN=production-tenant.auth0.com
      - VITE_AUTH0_CLIENT_ID=${FRONTEND_CLIENT_ID}

  backend:
    environment:
      - OAuth__Authority=${OAUTH_AUTHORITY}
      - OAuth__Audience=${OAUTH_AUDIENCE}
      - OAuth__ClientSecret=${OAUTH_CLIENT_SECRET}
    key_vault_secrets:
      - oauth-client-secret
      - jwt-signing-key
```

### 3. Monitoring and Alerting

- **OAuth provider health**: Monitor authentication success rates and latency
- **Token refresh rates**: Alert on high refresh failure rates
- **API key usage**: Track and alert on suspicious API key patterns
- **Security incidents**: Immediate alerts on authentication bypasses or scope escalation

---

This OAuth integration provides a secure, scalable authentication system that maintains backward compatibility while enabling user-scoped access control and comprehensive audit trails. The phased migration approach minimizes disruption while providing clear benefits in security and user experience.
