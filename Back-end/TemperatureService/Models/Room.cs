namespace TemperatureService.Models
{
    public class Room
    {
        public int RoomId { get; set; }

        public int HouseId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public decimal Area { get; set; }

        public string Placement { get; set; } = string.Empty; // Keeping for backward compatibility

        // Navigation property
        public House? House { get; set; }

        // Navigation property for temperatures
        public List<Temperature> Temperatures { get; set; } = new List<Temperature>();
    }
}