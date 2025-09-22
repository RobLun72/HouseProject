namespace TemperatureService.Entities
{
    public class Room
    {
        public int RoomId { get; set; }

        public int HouseId { get; set; }

        public double Area { get; set; }

        public string Placement { get; set; } = string.Empty;

        // Navigation property
        public House? House { get; set; }

        // Navigation property for temperatures
        public List<Temperature> Temperatures { get; set; } = new List<Temperature>();
    }
}