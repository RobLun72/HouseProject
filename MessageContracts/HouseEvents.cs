namespace MessageContracts
{
    public interface IHouseEvent
    {
        int HouseId { get; }
        DateTime EventTime { get; }
    }

    public interface IHouseCreated : IHouseEvent
    {
        string Name { get; }
        string Address { get; }
        decimal Area { get; }
    }

    public interface IHouseUpdated : IHouseEvent
    {
        string Name { get; }
        string Address { get; }
        decimal Area { get; }
    }

    public interface IHouseDeleted : IHouseEvent
    {
    }

    public class HouseCreated : IHouseCreated
    {
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public DateTime EventTime { get; set; }
    }

    public class HouseUpdated : IHouseUpdated
    {
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public DateTime EventTime { get; set; }
    }

    public class HouseDeleted : IHouseDeleted
    {
        public int HouseId { get; set; }
        public DateTime EventTime { get; set; }
    }
}