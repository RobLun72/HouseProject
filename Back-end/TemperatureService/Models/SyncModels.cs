namespace TemperatureService.Models
{
    public class SyncMessage
    {
        public string EventType { get; set; } = string.Empty; // "Created", "Updated", "Deleted"
        public string EntityType { get; set; } = string.Empty; // "House", "Room"
        public object Data { get; set; } = new object();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class HouseDto
    {
        public int HouseId { get; set; }
        public required string Name { get; set; } = string.Empty;
        public decimal Area { get; set; }
    }

    public class RoomDto
    {
        public int RoomId { get; set; }
        public int HouseId { get; set; }
        public required string Name { get; set; } = string.Empty;
        public required string Type { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public required string Placement { get; set; } = string.Empty;
    }

    public class TemperatureDto
    {
        public int TempId { get; set; }
        public int RoomId { get; set; }
        public int Hour { get; set; }
        public double Degrees { get; set; }
        public DateTime Date { get; set; }
    }

    // Result models for API responses
    public class HouseTempDataResult
    {
        public required HouseDto House { get; set; }
        public DateTime Date { get; set; }
        public required List<RoomTempData> Rooms { get; set; }
    }

    public class HouseRoomsResult
    {
        public required HouseDto House { get; set; }
        public required List<RoomDto> Rooms { get; set; }
    }

    public class HousesResult
    {
        public required List<HouseDto> Houses { get; set; }
    }

    public class HousesWithRoomsResult
    {
        public required List<HouseWithRoomsDto> Houses { get; set; }
    }

    public class HouseRoomTempResult
    {
        public required HouseDto House { get; set; }
        public required RoomDto Room { get; set; }
        public DateTime Date { get; set; }
        public required List<TemperatureDto> Temperatures { get; set; }
    }

    public class RoomTempData
    {
        public required RoomDto Room { get; set; }
        public required List<TemperatureDto> Temperatures { get; set; }
    }

    public class HouseWithRoomsDto
    {
        public int HouseId { get; set; }
        public required string Name { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public required List<RoomDto> Rooms { get; set; }
    }
}