using System.Text.Json;
using TemperatureService.Entities;
using TemperatureService.Models;

namespace TemperatureService.Services
{
    public interface ISyncService
    {
        Task ProcessSyncMessageAsync(SyncMessage message);
    }

    public class SyncService : ISyncService
    {
        private readonly IHouseDataService _houseDataService;
        private readonly ILogger<SyncService> _logger;

        public SyncService(IHouseDataService houseDataService, ILogger<SyncService> logger)
        {
            _houseDataService = houseDataService;
            _logger = logger;
        }

        public async Task ProcessSyncMessageAsync(SyncMessage message)
        {
            _logger.LogInformation("Processing sync message: {EventType} {EntityType} at {Timestamp}", 
                message.EventType, message.EntityType, message.Timestamp);

            try
            {
                switch (message.EntityType.ToLower())
                {
                    case "house":
                        await ProcessHouseSyncAsync(message);
                        break;
                    case "room":
                        await ProcessRoomSyncAsync(message);
                        break;
                    default:
                        _logger.LogWarning("Unknown entity type in sync message: {EntityType}", message.EntityType);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing sync message: {EventType} {EntityType}", 
                    message.EventType, message.EntityType);
            }
        }

        private async Task ProcessHouseSyncAsync(SyncMessage message)
        {
            var houseData = JsonSerializer.Deserialize<HouseDto>(message.Data.ToString() ?? "{}", 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (houseData == null)
            {
                _logger.LogWarning("Invalid house data in sync message");
                return;
            }

            switch (message.EventType.ToLower())
            {
                case "created":
                case "updated":
                    var house = new House
                    {
                        HouseId = houseData.HouseId,
                        Name = houseData.Name,
                        Area = houseData.Area
                    };

                    var existingHouse = await _houseDataService.GetHouseAsync(houseData.HouseId);
                    if (existingHouse == null)
                    {
                        await _houseDataService.CreateHouseAsync(house);
                        _logger.LogInformation("Synced new house: {HouseId} - {Name}", house.HouseId, house.Name);
                    }
                    else
                    {
                        await _houseDataService.UpdateHouseAsync(houseData.HouseId, house);
                        _logger.LogInformation("Synced updated house: {HouseId} - {Name}", house.HouseId, house.Name);
                    }
                    break;

                case "deleted":
                    await _houseDataService.DeleteHouseAsync(houseData.HouseId);
                    _logger.LogInformation("Synced deleted house: {HouseId}", houseData.HouseId);
                    break;

                default:
                    _logger.LogWarning("Unknown event type for house sync: {EventType}", message.EventType);
                    break;
            }
        }

        private async Task ProcessRoomSyncAsync(SyncMessage message)
        {
            var roomData = JsonSerializer.Deserialize<RoomDto>(message.Data.ToString() ?? "{}", 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (roomData == null)
            {
                _logger.LogWarning("Invalid room data in sync message");
                return;
            }

            switch (message.EventType.ToLower())
            {
                case "created":
                case "updated":
                    var room = new Room
                    {
                        RoomId = roomData.RoomId,
                        HouseId = roomData.HouseId,
                        Area = roomData.Area,
                        Placement = roomData.Placement
                    };

                    var existingRoom = await _houseDataService.GetRoomAsync(roomData.RoomId);
                    if (existingRoom == null)
                    {
                        await _houseDataService.CreateRoomAsync(room);
                        _logger.LogInformation("Synced new room: {RoomId} - {Placement}", room.RoomId, room.Placement);
                    }
                    else
                    {
                        await _houseDataService.UpdateRoomAsync(roomData.RoomId, room);
                        _logger.LogInformation("Synced updated room: {RoomId} - {Placement}", room.RoomId, room.Placement);
                    }
                    break;

                case "deleted":
                    await _houseDataService.DeleteRoomAsync(roomData.RoomId);
                    _logger.LogInformation("Synced deleted room: {RoomId}", roomData.RoomId);
                    break;

                default:
                    _logger.LogWarning("Unknown event type for room sync: {EventType}", message.EventType);
                    break;
            }
        }
    }
}