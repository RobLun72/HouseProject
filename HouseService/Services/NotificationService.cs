using HouseService.Models;
using System.Text;
using System.Text.Json;

namespace HouseService.Services
{
    public interface INotificationService
    {
        Task NotifyHouseCreatedAsync(House house);
        Task NotifyHouseUpdatedAsync(House house);
        Task NotifyHouseDeletedAsync(int houseId);
        Task NotifyRoomCreatedAsync(Room room);
        Task NotifyRoomUpdatedAsync(Room room);
        Task NotifyRoomDeletedAsync(int roomId);
    }

    public class NotificationService : INotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<NotificationService> _logger;
        private readonly string _temperatureServiceUrl;

        public NotificationService(HttpClient httpClient, ILogger<NotificationService> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _temperatureServiceUrl = configuration["Services:TemperatureService:BaseUrl"] ?? "https://localhost:7002";
        }

        public async Task NotifyHouseCreatedAsync(House house)
        {
            var message = new SyncMessage
            {
                EventType = "Created",
                EntityType = "House",
                Data = new HouseDto { HouseId = house.HouseId, Name = house.Name, Area = house.Area }
            };

            await SendNotificationAsync(message, "house created");
        }

        public async Task NotifyHouseUpdatedAsync(House house)
        {
            var message = new SyncMessage
            {
                EventType = "Updated",
                EntityType = "House",
                Data = new HouseDto { HouseId = house.HouseId, Name = house.Name, Area = house.Area }
            };

            await SendNotificationAsync(message, "house updated");
        }

        public async Task NotifyHouseDeletedAsync(int houseId)
        {
            var message = new SyncMessage
            {
                EventType = "Deleted",
                EntityType = "House",
                Data = new HouseDto { HouseId = houseId, Name = "", Area = 0 }
            };

            await SendNotificationAsync(message, "house deleted");
        }

        public async Task NotifyRoomCreatedAsync(Room room)
        {
            var message = new SyncMessage
            {
                EventType = "Created",
                EntityType = "Room",
                Data = new RoomDto { RoomId = room.RoomId, HouseId = room.HouseId, Area = room.Area, Placement = room.Placement }
            };

            await SendNotificationAsync(message, "room created");
        }

        public async Task NotifyRoomUpdatedAsync(Room room)
        {
            var message = new SyncMessage
            {
                EventType = "Updated",
                EntityType = "Room",
                Data = new RoomDto { RoomId = room.RoomId, HouseId = room.HouseId, Area = room.Area, Placement = room.Placement }
            };

            await SendNotificationAsync(message, "room updated");
        }

        public async Task NotifyRoomDeletedAsync(int roomId)
        {
            var message = new SyncMessage
            {
                EventType = "Deleted",
                EntityType = "Room",
                Data = new RoomDto { RoomId = roomId, HouseId = 0, Area = 0, Placement = "" }
            };

            await SendNotificationAsync(message, "room deleted");
        }

        private async Task SendNotificationAsync(SyncMessage message, string operationDescription)
        {
            try
            {
                var json = JsonSerializer.Serialize(message);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_temperatureServiceUrl}/Sync/house-data", content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully notified TemperatureService about {Operation}", operationDescription);
                }
                else
                {
                    _logger.LogWarning("Failed to notify TemperatureService about {Operation}. Status: {StatusCode}", 
                        operationDescription, response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification to TemperatureService about {Operation}", operationDescription);
            }
        }
    }
}