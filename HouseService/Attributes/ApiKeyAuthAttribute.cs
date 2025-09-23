using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HouseService.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class ApiKeyAuthAttribute : Attribute, IAuthorizationFilter
    {
        private const string API_KEY_HEADER_NAME = "X-Api-Key";

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<ApiKeyAuthAttribute>>();

            // Get the API key from the request header
            if (!context.HttpContext.Request.Headers.TryGetValue(API_KEY_HEADER_NAME, out var extractedApiKey))
            {
                logger.LogWarning("API key missing from request headers");
                context.Result = new UnauthorizedObjectResult(new { error = "API key is required" });
                return;
            }

            // Get valid API keys from configuration
            var validApiKeys = configuration.GetSection("ApiKeys").Get<string[]>();
            
            if (validApiKeys == null || validApiKeys.Length == 0)
            {
                logger.LogError("No valid API keys configured");
                context.Result = new StatusCodeResult(500);
                return;
            }

            // Validate the API key
            if (!validApiKeys.Contains(extractedApiKey.ToString()))
            {
                logger.LogWarning("Invalid API key provided: {ApiKey}", extractedApiKey.ToString());
                context.Result = new UnauthorizedObjectResult(new { error = "Invalid API key" });
                return;
            }

            logger.LogInformation("Valid API key provided for request to {Path}", context.HttpContext.Request.Path);
        }
    }
}