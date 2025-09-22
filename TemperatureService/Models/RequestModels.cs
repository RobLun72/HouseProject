namespace TemperatureService.Models
{
    public class CreateTemperatureRequest
    {
        public int RoomId { get; set; }
        public int Hour { get; set; }
        public double Degrees { get; set; }
        public DateTime Date { get; set; }
    }

    public class UpdateTemperatureRequest
    {
        public int RoomId { get; set; }
        public int Hour { get; set; }
        public double Degrees { get; set; }
        public DateTime Date { get; set; }
    }
}