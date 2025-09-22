namespace HouseService.Models
{
    public class CreateHouseRequest
    {
        public string Name { get; set; } = string.Empty;
        public double Area { get; set; }
    }

    public class UpdateHouseRequest
    {
        public string Name { get; set; } = string.Empty;
        public double Area { get; set; }
    }

    public class CreateRoomRequest
    {
        public int HouseId { get; set; }
        public double Area { get; set; }
        public string Placement { get; set; } = string.Empty;
    }

    public class UpdateRoomRequest
    {
        public int HouseId { get; set; }
        public double Area { get; set; }
        public string Placement { get; set; } = string.Empty;
    }
}