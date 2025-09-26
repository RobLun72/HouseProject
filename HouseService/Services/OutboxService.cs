using System.Text.Json;
using HouseService.Entities;
using MessageContracts;

namespace HouseService.Services
{
    public interface IOutboxService
    {
        OutboxEvent CreateHouseCreatedEvent(int houseId, string name, string address, decimal area);
        OutboxEvent CreateHouseUpdatedEvent(int houseId, string name, string address, decimal area);
        OutboxEvent CreateHouseDeletedEvent(int houseId);
        OutboxEvent CreateRoomCreatedEvent(int roomId, int houseId, string name, string type, decimal area, string placement);
        OutboxEvent CreateRoomUpdatedEvent(int roomId, int houseId, string name, string type, decimal area, string placement);
        OutboxEvent CreateRoomDeletedEvent(int roomId);
    }

    public class OutboxService : IOutboxService
    {
        public OutboxEvent CreateHouseCreatedEvent(int houseId, string name, string address, decimal area)
        {
            var eventData = new HouseCreated
            {
                HouseId = houseId,
                Name = name,
                Address = address,
                Area = area,
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(HouseCreated),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }

        public OutboxEvent CreateHouseUpdatedEvent(int houseId, string name, string address, decimal area)
        {
            var eventData = new HouseUpdated
            {
                HouseId = houseId,
                Name = name,
                Address = address,
                Area = area,
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(HouseUpdated),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }

        public OutboxEvent CreateHouseDeletedEvent(int houseId)
        {
            var eventData = new HouseDeleted
            {
                HouseId = houseId,
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(HouseDeleted),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }

        public OutboxEvent CreateRoomCreatedEvent(int roomId, int houseId, string name, string type, decimal area, string placement)
        {
            var eventData = new RoomCreated
            {
                RoomId = roomId,
                HouseId = houseId,
                Name = name,
                Type = type,
                Area = area,
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(RoomCreated),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }

        public OutboxEvent CreateRoomUpdatedEvent(int roomId, int houseId, string name, string type, decimal area, string placement)
        {
            var eventData = new RoomUpdated
            {
                RoomId = roomId,
                HouseId = houseId,
                Name = name,
                Type = type,
                Area = area,
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(RoomUpdated),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }

        public OutboxEvent CreateRoomDeletedEvent(int roomId)
        {
            var eventData = new RoomDeleted
            {
                RoomId = roomId,
                HouseId = 0, // Will be set appropriately when called
                EventTime = DateTime.UtcNow
            };

            return new OutboxEvent
            {
                EventType = nameof(RoomDeleted),
                EventData = JsonSerializer.Serialize(eventData),
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}