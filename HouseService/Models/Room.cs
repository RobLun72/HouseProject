namespace HouseService.Models
{
    public class Room
    {
        public int RoomId { get; set; }

        public int HouseId { get; set; }

        public double Area { get; set; }

        public string Placement { get; set; } = string.Empty;
    }
}