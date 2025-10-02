namespace HouseService.Models
{
    public class CreateHouseRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Area { get; set; }
    }

    public class UpdateHouseRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Area { get; set; }
    }

    public class CreateRoomRequest
    {
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string Placement { get; set; } = string.Empty; // Keeping for backward compatibility
    }

    public class UpdateRoomRequest
    {
        public int HouseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public string Placement { get; set; } = string.Empty; // Keeping for backward compatibility
    }
}