namespace HouseService.Models
{
    public class Room
    {
        public int RoomId { get; set; }

        public int HouseId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public decimal Area { get; set; }

        // Keeping Placement for backward compatibility if needed
        public string Placement { get; set; } = string.Empty;
    }
}