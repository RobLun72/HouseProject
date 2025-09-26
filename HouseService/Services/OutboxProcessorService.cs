using System.Text.Json;
using HouseService.Data;
using HouseService.Services;
using Microsoft.EntityFrameworkCore;
using MessageContracts;

namespace HouseService.Services
{
    public class OutboxProcessorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<OutboxProcessorService> _logger;
        private readonly TimeSpan _processingInterval;

        public OutboxProcessorService(IServiceProvider serviceProvider, ILogger<OutboxProcessorService> logger, IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            
            // Read processing interval from configuration, default to 10 seconds
            var intervalSeconds = configuration.GetValue<int>("OutboxProcessor:IntervalSeconds", 10);
            _processingInterval = TimeSpan.FromSeconds(intervalSeconds);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Outbox Processor Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessOutboxEvents();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing outbox events");
                }

                await Task.Delay(_processingInterval, stoppingToken);
            }
        }

        private async Task ProcessOutboxEvents()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<HouseDbContext>();
            var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

            // Get all unpublished events, ordered by creation time
            var unpublishedEvents = await context.OutboxEvents
                .Where(e => !e.IsPublished && e.RetryCount < 5) // Max 5 retries
                .OrderBy(e => e.CreatedAt)
                .Take(50) // Process max 50 events per batch
                .ToListAsync();

            foreach (var outboxEvent in unpublishedEvents)
            {
                try
                {
                    await PublishEvent(outboxEvent, messagePublisher);
                    
                    // Mark as published
                    outboxEvent.IsPublished = true;
                    outboxEvent.PublishedAt = DateTime.UtcNow;
                    outboxEvent.LastError = null;
                    
                    await context.SaveChangesAsync();
                    
                    _logger.LogDebug("Successfully published event {EventType} with ID {EventId}", outboxEvent.EventType, outboxEvent.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to publish event {EventType} with ID {EventId}. Retry count: {RetryCount}", 
                        outboxEvent.EventType, outboxEvent.Id, outboxEvent.RetryCount);
                    
                    // Increment retry count and store error
                    outboxEvent.RetryCount++;
                    outboxEvent.LastError = ex.Message;
                    
                    await context.SaveChangesAsync();
                }
            }

            if (unpublishedEvents.Count > 0)
            {
                _logger.LogInformation("Processed {Count} outbox events", unpublishedEvents.Count);
            }
        }

        private async Task PublishEvent(Entities.OutboxEvent outboxEvent, IMessagePublisher messagePublisher)
        {
            switch (outboxEvent.EventType)
            {
                case nameof(HouseCreated):
                    var houseCreated = JsonSerializer.Deserialize<HouseCreated>(outboxEvent.EventData);
                    if (houseCreated != null)
                    {
                        await messagePublisher.PublishHouseCreatedAsync(
                            houseCreated.HouseId, 
                            houseCreated.Name, 
                            houseCreated.Address, 
                            houseCreated.Area);
                    }
                    break;

                case nameof(HouseUpdated):
                    var houseUpdated = JsonSerializer.Deserialize<HouseUpdated>(outboxEvent.EventData);
                    if (houseUpdated != null)
                    {
                        await messagePublisher.PublishHouseUpdatedAsync(
                            houseUpdated.HouseId, 
                            houseUpdated.Name, 
                            houseUpdated.Address, 
                            houseUpdated.Area);
                    }
                    break;

                case nameof(HouseDeleted):
                    var houseDeleted = JsonSerializer.Deserialize<HouseDeleted>(outboxEvent.EventData);
                    if (houseDeleted != null)
                    {
                        await messagePublisher.PublishHouseDeletedAsync(houseDeleted.HouseId);
                    }
                    break;

                case nameof(RoomCreated):
                    var roomCreated = JsonSerializer.Deserialize<RoomCreated>(outboxEvent.EventData);
                    if (roomCreated != null)
                    {
                        await messagePublisher.PublishRoomCreatedAsync(
                            roomCreated.RoomId,
                            roomCreated.HouseId,
                            roomCreated.Name,
                            roomCreated.Type,
                            roomCreated.Area);
                    }
                    break;

                case nameof(RoomUpdated):
                    var roomUpdated = JsonSerializer.Deserialize<RoomUpdated>(outboxEvent.EventData);
                    if (roomUpdated != null)
                    {
                        await messagePublisher.PublishRoomUpdatedAsync(
                            roomUpdated.RoomId,
                            roomUpdated.HouseId,
                            roomUpdated.Name,
                            roomUpdated.Type,
                            roomUpdated.Area);
                    }
                    break;

                case nameof(RoomDeleted):
                    var roomDeleted = JsonSerializer.Deserialize<RoomDeleted>(outboxEvent.EventData);
                    if (roomDeleted != null)
                    {
                        await messagePublisher.PublishRoomDeletedAsync(roomDeleted.RoomId, 0); // HouseId not needed for delete
                    }
                    break;

                default:
                    _logger.LogWarning("Unknown event type: {EventType}", outboxEvent.EventType);
                    break;
            }
        }
    }
}