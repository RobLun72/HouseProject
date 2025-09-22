namespace TemperatureService.Models
{
    public class House
    {
        public int HouseId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public decimal Area { get; set; }

        // Navigation property for related rooms
        public List<Room> Rooms { get; set; } = new List<Room>();
    }
}