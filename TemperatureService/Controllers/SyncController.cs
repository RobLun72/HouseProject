using Microsoft.AspNetCore.Mvc;
using TemperatureService.Models;
using TemperatureService.Services;

namespace TemperatureService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SyncController : ControllerBase
    {
        private readonly ISyncService _syncService;
        private readonly ILogger<SyncController> _logger;

        public SyncController(ISyncService syncService, ILogger<SyncController> logger)
        {
            _syncService = syncService;
            _logger = logger;
        }

        [HttpPost("house-data")]
        public async Task<IActionResult> ReceiveHouseDataSync([FromBody] SyncMessage message)
        {
            if (message == null)
            {
                return BadRequest("Invalid sync message");
            }

            try
            {
                await _syncService.ProcessSyncMessageAsync(message);
                _logger.LogInformation("Successfully processed sync message: {EventType} {EntityType}", 
                    message.EventType, message.EntityType);
                return Ok(new { Status = "Success", Message = "Sync message processed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing sync message: {EventType} {EntityType}", 
                    message.EventType, message.EntityType);
                return StatusCode(500, new { Status = "Error", Message = "Failed to process sync message" });
            }
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { 
                Status = "Healthy", 
                Service = "TemperatureService-Sync", 
                Timestamp = DateTime.UtcNow 
            });
        }
    }
}