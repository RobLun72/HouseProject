using MassTransit;
using Microsoft.EntityFrameworkCore;
using TemperatureService.Data;
using TemperatureService.Models;
using MessageContracts;

namespace TemperatureService.Consumers
{
    public class HouseCreatedConsumer : IConsumer<IHouseCreated>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<HouseCreatedConsumer> _logger;

        public HouseCreatedConsumer(TemperatureDbContext context, ILogger<HouseCreatedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IHouseCreated> context)
        {
            _logger.LogWarning("=== HouseCreatedConsumer.Consume() CALLED ===");
            _logger.LogInformation("Message Type: {MessageType}", context.Message.GetType().FullName);
            _logger.LogInformation("Consumer received message with correlation ID: {CorrelationId}", context.CorrelationId);
            
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing HouseCreated event for House ID: {HouseId}, Name: {Name}, Address: {Address}, Area: {Area}", 
                    message.HouseId, message.Name, message.Address, message.Area);

                // Check if house already exists to prevent duplicates
                var existingHouse = await _context.Houses.FirstOrDefaultAsync(h => h.HouseId == message.HouseId);
                if (existingHouse != null)
                {
                    _logger.LogWarning("House with ID {HouseId} already exists in TemperatureService database", message.HouseId);
                    return;
                }

                var house = new House
                {
                    HouseId = message.HouseId,
                    Name = message.Name,
                    Address = message.Address,
                    Area = message.Area
                };

                _context.Houses.Add(house);
                await _context.SaveChangesAsync();

                _logger.LogWarning("=== Successfully created house with ID: {HouseId} in TemperatureService ===", message.HouseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "=== FAILED to process HouseCreated event for House ID: {HouseId} ===", context.Message.HouseId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }

    public class HouseUpdatedConsumer : IConsumer<IHouseUpdated>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<HouseUpdatedConsumer> _logger;

        public HouseUpdatedConsumer(TemperatureDbContext context, ILogger<HouseUpdatedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IHouseUpdated> context)
        {
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing HouseUpdated event for House ID: {HouseId}", message.HouseId);

                var house = await _context.Houses.FirstOrDefaultAsync(h => h.HouseId == message.HouseId);
                if (house == null)
                {
                    _logger.LogWarning("House with ID {HouseId} not found in TemperatureService database", message.HouseId);
                    return;
                }

                house.Name = message.Name;
                house.Address = message.Address;
                house.Area = message.Area;

                _context.Entry(house).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated house with ID: {HouseId} in TemperatureService", message.HouseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process HouseUpdated event for House ID: {HouseId}", context.Message.HouseId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }

    public class HouseDeletedConsumer : IConsumer<IHouseDeleted>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<HouseDeletedConsumer> _logger;

        public HouseDeletedConsumer(TemperatureDbContext context, ILogger<HouseDeletedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IHouseDeleted> context)
        {
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing HouseDeleted event for House ID: {HouseId}", message.HouseId);

                var house = await _context.Houses.FirstOrDefaultAsync(h => h.HouseId == message.HouseId);
                if (house == null)
                {
                    _logger.LogWarning("House with ID {HouseId} not found in TemperatureService database", message.HouseId);
                    return;
                }

                // Also delete all associated rooms and temperatures
                var rooms = await _context.Rooms.Where(r => r.HouseId == message.HouseId).ToListAsync();
                var roomIds = rooms.Select(r => r.RoomId).ToList();
                
                if (roomIds.Any())
                {
                    var temperatures = await _context.Temperatures.Where(t => roomIds.Contains(t.RoomId)).ToListAsync();
                    _context.Temperatures.RemoveRange(temperatures);
                    _context.Rooms.RemoveRange(rooms);
                }

                _context.Houses.Remove(house);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted house with ID: {HouseId} and all associated data from TemperatureService", message.HouseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process HouseDeleted event for House ID: {HouseId}", context.Message.HouseId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }
}