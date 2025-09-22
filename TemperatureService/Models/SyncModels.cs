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
        public string Name { get; set; } = string.Empty;
        public decimal Area { get; set; }
    }

    public class RoomDto
    {
        public int RoomId { get; set; }
        public int HouseId { get; set; }
        public decimal Area { get; set; }
        public string Placement { get; set; } = string.Empty;
    }
}