using System.ComponentModel.DataAnnotations;

namespace HouseService.Entities
{
    public class OutboxEvent
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string EventType { get; set; } = string.Empty;
        
        [Required]
        public string EventData { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsPublished { get; set; } = false;
        
        public DateTime? PublishedAt { get; set; }
        
        public int RetryCount { get; set; } = 0;
        
        public string? LastError { get; set; }
    }
}