using MassTransit;
using Microsoft.EntityFrameworkCore;
using TemperatureService.Data;
using TemperatureService.Models;
using MessageContracts;

namespace TemperatureService.Consumers
{
    public class RoomCreatedConsumer : IConsumer<IRoomCreated>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<RoomCreatedConsumer> _logger;

        public RoomCreatedConsumer(TemperatureDbContext context, ILogger<RoomCreatedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IRoomCreated> context)
        {
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing RoomCreated event for Room ID: {RoomId}, House ID: {HouseId}", message.RoomId, message.HouseId);

                // Check if room already exists to prevent duplicates
                var existingRoom = await _context.Rooms.FirstOrDefaultAsync(r => r.RoomId == message.RoomId);
                if (existingRoom != null)
                {
                    _logger.LogWarning("Room with ID {RoomId} already exists in TemperatureService database", message.RoomId);
                    return;
                }

                // Verify the house exists
                var house = await _context.Houses.FirstOrDefaultAsync(h => h.HouseId == message.HouseId);
                if (house == null)
                {
                    _logger.LogWarning("House with ID {HouseId} not found in TemperatureService database for Room ID: {RoomId}", message.HouseId, message.RoomId);
                    return;
                }

                var room = new Room
                {
                    RoomId = message.RoomId,
                    HouseId = message.HouseId,
                    Name = message.Name,
                    Type = message.Type,
                    Area = message.Area
                };

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created room with ID: {RoomId} in TemperatureService", message.RoomId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process RoomCreated event for Room ID: {RoomId}", context.Message.RoomId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }

    public class RoomUpdatedConsumer : IConsumer<IRoomUpdated>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<RoomUpdatedConsumer> _logger;

        public RoomUpdatedConsumer(TemperatureDbContext context, ILogger<RoomUpdatedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IRoomUpdated> context)
        {
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing RoomUpdated event for Room ID: {RoomId}, House ID: {HouseId}", message.RoomId, message.HouseId);

                var room = await _context.Rooms.FirstOrDefaultAsync(r => r.RoomId == message.RoomId);
                if (room == null)
                {
                    _logger.LogWarning("Room with ID {RoomId} not found in TemperatureService database", message.RoomId);
                    return;
                }

                // Verify the house exists if it's being changed
                if (room.HouseId != message.HouseId)
                {
                    var house = await _context.Houses.FirstOrDefaultAsync(h => h.HouseId == message.HouseId);
                    if (house == null)
                    {
                        _logger.LogWarning("House with ID {HouseId} not found in TemperatureService database for Room ID: {RoomId}", message.HouseId, message.RoomId);
                        return;
                    }
                }

                room.HouseId = message.HouseId;
                room.Name = message.Name;
                room.Type = message.Type;
                room.Area = message.Area;

                _context.Entry(room).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated room with ID: {RoomId} in TemperatureService", message.RoomId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process RoomUpdated event for Room ID: {RoomId}", context.Message.RoomId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }

    public class RoomDeletedConsumer : IConsumer<IRoomDeleted>
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<RoomDeletedConsumer> _logger;

        public RoomDeletedConsumer(TemperatureDbContext context, ILogger<RoomDeletedConsumer> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<IRoomDeleted> context)
        {
            try
            {
                var message = context.Message;
                _logger.LogInformation("Processing RoomDeleted event for Room ID: {RoomId}, House ID: {HouseId}", message.RoomId, message.HouseId);

                var room = await _context.Rooms.FirstOrDefaultAsync(r => r.RoomId == message.RoomId);
                if (room == null)
                {
                    _logger.LogWarning("Room with ID {RoomId} not found in TemperatureService database", message.RoomId);
                    return;
                }

                // Delete all associated temperatures first
                var temperatures = await _context.Temperatures.Where(t => t.RoomId == message.RoomId).ToListAsync();
                if (temperatures.Any())
                {
                    _context.Temperatures.RemoveRange(temperatures);
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted room with ID: {RoomId} and all associated temperatures from TemperatureService", message.RoomId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process RoomDeleted event for Room ID: {RoomId}", context.Message.RoomId);
                throw; // Re-throw to trigger retry mechanism
            }
        }
    }
}