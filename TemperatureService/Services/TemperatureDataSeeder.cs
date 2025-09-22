using TemperatureService.Data;
using Microsoft.EntityFrameworkCore;

namespace TemperatureService.Services
{
    public interface ITemperatureDataSeeder
    {
        Task SeedTemperatureDataAsync();
        Task UpdateExistingRecordsWithDatesAsync();
    }

    public class TemperatureDataSeeder : ITemperatureDataSeeder
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<TemperatureDataSeeder> _logger;

        public TemperatureDataSeeder(TemperatureDbContext context, ILogger<TemperatureDataSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedTemperatureDataAsync()
        {
            var rooms = await _context.Rooms.ToListAsync();
            if (!rooms.Any())
            {
                _logger.LogWarning("No rooms found. Cannot seed temperature data.");
                return;
            }

            var startDate = DateTime.UtcNow.Date.AddDays(-30); // Last 30 days
            var endDate = DateTime.UtcNow.Date;

            var random = new Random();
            var temperaturesToAdd = new List<Temperature>();

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                foreach (var room in rooms)
                {
                    // Generate temperatures for key hours of the day
                    var hoursToGenerate = new[] { 6, 9, 12, 15, 18, 21 }; // 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM

                    foreach (var hour in hoursToGenerate)
                    {
                        // Check if temperature already exists
                        var exists = await _context.Temperatures
                            .AnyAsync(t => t.RoomId == room.RoomId && t.Hour == hour && t.Date.Date == date);

                        if (!exists)
                        {
                            var baseTemp = GetBaseTemperatureForRoom(room.Placement);
                            var variation = GetTemperatureVariation(hour, random);
                            var seasonalAdjustment = GetSeasonalAdjustment(date);
                            
                            var temperature = new Temperature
                            {
                                RoomId = room.RoomId,
                                Hour = hour,
                                Date = date,
                                Degrees = Math.Round(baseTemp + variation + seasonalAdjustment, 1)
                            };

                            temperaturesToAdd.Add(temperature);
                        }
                    }
                }
            }

            if (temperaturesToAdd.Any())
            {
                _context.Temperatures.AddRange(temperaturesToAdd);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Seeded {temperaturesToAdd.Count} temperature records");
            }
            else
            {
                _logger.LogInformation("No new temperature records to seed");
            }
        }

        public async Task UpdateExistingRecordsWithDatesAsync()
        {
            var existingRecords = await _context.Temperatures
                .Where(t => t.Date == DateTime.MinValue || t.Date.Year == 1)
                .ToListAsync();

            if (existingRecords.Any())
            {
                var baseDate = DateTime.UtcNow.Date.AddDays(-7); // Set to a week ago
                
                for (int i = 0; i < existingRecords.Count; i++)
                {
                    existingRecords[i].Date = baseDate.AddDays(i % 7); // Spread across the last week
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Updated {existingRecords.Count} existing temperature records with meaningful dates");
            }
        }

        private double GetBaseTemperatureForRoom(string placement)
        {
            return placement.ToLower() switch
            {
                "living room" => 22.0,
                "bedroom" => 20.0,
                "kitchen" => 24.0,
                "bathroom" => 23.0,
                "office" => 21.0,
                _ => 21.5
            };
        }

        private double GetTemperatureVariation(int hour, Random random)
        {
            // Temperature patterns throughout the day
            var hourVariation = hour switch
            {
                6 => -2.0,  // Early morning - cooler
                9 => -1.0,  // Morning
                12 => 1.0,  // Noon - warmer
                15 => 2.0,  // Afternoon - warmest
                18 => 0.5,  // Evening
                21 => -0.5, // Night
                _ => 0.0
            };

            // Add random variation (-1 to +1 degrees)
            var randomVariation = (random.NextDouble() - 0.5) * 2;
            
            return hourVariation + randomVariation;
        }

        private double GetSeasonalAdjustment(DateTime date)
        {
            // Simple seasonal adjustment based on month
            return date.Month switch
            {
                12 or 1 or 2 => -3.0,  // Winter
                3 or 4 or 5 => 0.0,    // Spring
                6 or 7 or 8 => 3.0,    // Summer
                9 or 10 or 11 => 1.0,  // Fall
                _ => 0.0
            };
        }
    }
}