namespace MessageContracts
{
    public interface IRoomEvent
    {
        int RoomId { get; }
        int HouseId { get; }
        DateTime EventTime { get; }
    }

    public interface IRoomCreated : IRoomEvent
    {
        string Name { get; }
        string Type { get; }
        decimal Area { get; }
        string Placement { get; }
    }

    public interface IRoomUpdated : IRoomEvent
    {
        string Name { get; }
        string Type { get; }
        decimal Area { get; }
        string Placement { get; }
    }

    public interface IRoomDeleted : IRoomEvent
    {
    }

    public class RoomCreated : IRoomCreated
    {
        public int RoomId { get; set; }
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string Placement { get; set; } = string.Empty;
        public DateTime EventTime { get; set; }
    }

    public class RoomUpdated : IRoomUpdated
    {
        public int RoomId { get; set; }
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string Placement { get; set; } = string.Empty;
        public DateTime EventTime { get; set; }
    }

    public class RoomDeleted : IRoomDeleted
    {
        public int RoomId { get; set; }
        public int HouseId { get; set; }
        public DateTime EventTime { get; set; }
    }
}