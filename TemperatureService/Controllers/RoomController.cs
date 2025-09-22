using Microsoft.AspNetCore.Mvc;
using TemperatureService.Entities;
using TemperatureService.Services;
using TemperatureService.Data;
using Microsoft.EntityFrameworkCore;

namespace TemperatureService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RoomController : ControllerBase
    {
        private readonly IHouseDataService _houseDataService;
        private readonly TemperatureDbContext _context;
        private readonly ILogger<RoomController> _logger;

        public RoomController(IHouseDataService houseDataService, TemperatureDbContext context, ILogger<RoomController> logger)
        {
            _houseDataService = houseDataService;
            _context = context;
            _logger = logger;
        }

        [HttpGet("house/{houseId}/room/{roomId}/date/{date:datetime}")]
        public async Task<ActionResult<HouseRoomTempResult>> GetHouseRoomTempValues(int houseId, int roomId, DateTime date)
        {
            // Get house information
            var house = await _houseDataService.GetHouseAsync(houseId);
            if (house == null)
            {
                return NotFound("House not found");
            }

            // Get room information and verify it belongs to the house
            var room = await _houseDataService.GetRoomAsync(roomId);
            if (room == null)
            {
                return NotFound("Room not found");
            }

            if (room.HouseId != houseId)
            {
                return BadRequest("Room does not belong to the specified house");
            }

            // Convert to UTC for PostgreSQL compatibility
            var searchDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

            // Get temperature data for the room on the specified date
            var temperatures = await _context.Temperatures
                .Where(t => t.RoomId == roomId && t.Date.Date == searchDate.Date)
                .OrderBy(t => t.Hour)
                .ToListAsync();

            var result = new HouseRoomTempResult
            {
                House = new HouseDto
                {
                    HouseId = house.HouseId,
                    Name = house.Name,
                    Area = house.Area
                },
                Room = new RoomDto
                {
                    RoomId = room.RoomId,
                    HouseId = room.HouseId,
                    Area = room.Area,
                    Placement = room.Placement
                },
                Date = searchDate,
                Temperatures = temperatures.Select(t => new TemperatureDto
                {
                    TempId = t.TempId,
                    RoomId = t.RoomId,
                    Hour = t.Hour,
                    Degrees = t.Degrees,
                    Date = t.Date
                }).ToList()
            };

            return Ok(result);
        }
    }

    public class HouseRoomTempResult
    {
        public HouseDto House { get; set; }
        public RoomDto Room { get; set; }
        public DateTime Date { get; set; }
        public List<TemperatureDto> Temperatures { get; set; }
    }
}