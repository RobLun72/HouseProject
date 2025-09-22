namespace TemperatureService.Entities
{
    public class House
    {
        public int HouseId { get; set; }

        public string Name { get; set; } = string.Empty;

        public double Area { get; set; }

        // Navigation property for related rooms
        public List<Room> Rooms { get; set; } = new List<Room>();
    }
}