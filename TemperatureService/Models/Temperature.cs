namespace TemperatureService.Models
{
    public class Temperature
    {
        public int TempId { get; set; }

        public int RoomId { get; set; }

        public int Hour { get; set; }

        public double Degrees { get; set; }

        public DateTime Date { get; set; }
    }
}