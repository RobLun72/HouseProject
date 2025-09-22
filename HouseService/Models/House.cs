namespace HouseService.Models
{
    public class House
    {
        public int HouseId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public decimal Area { get; set; }
    }
}