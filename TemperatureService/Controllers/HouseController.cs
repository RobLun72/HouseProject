using Microsoft.AspNetCore.Mvc;
using TemperatureService.Models;
using TemperatureService.Services;
using TemperatureService.Data;
using Microsoft.EntityFrameworkCore;
using TemperatureService.Attributes;

namespace TemperatureService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [ApiKeyAuth]
    public class HouseController : ControllerBase
    {
        private readonly IHouseDataService _houseDataService;
        private readonly TemperatureDbContext _context;
        private readonly ILogger<HouseController> _logger;

        public HouseController(IHouseDataService houseDataService, TemperatureDbContext context, ILogger<HouseController> logger)
        {
            _houseDataService = houseDataService;
            _context = context;
            _logger = logger;
        }

        [HttpGet("{id}/date/{date:datetime}")]
        public async Task<ActionResult<HouseTempDataResult>> GetHouseTempValues(int id, DateTime date)
        {
            var house = await _houseDataService.GetHouseAsync(id);
            if (house == null)
            {
                return NotFound("House not found");
            }

            var rooms = await _houseDataService.GetRoomsByHouseAsync(id);
            var roomTempData = new List<RoomTempData>();

            // Convert to UTC for PostgreSQL compatibility
            var searchDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);

            foreach (var room in rooms)
            {
                var temperatures = await _context.Temperatures
                    .Where(t => t.RoomId == room.RoomId && t.Date.Date == searchDate.Date)
                    .OrderBy(t => t.Hour)
                    .ToListAsync();

                roomTempData.Add(new RoomTempData
                {
                    Room = new RoomDto
                    {
                        RoomId = room.RoomId,
                        HouseId = room.HouseId,
                        Name = room.Name,
                        Type = room.Type,
                        Area = room.Area,
                        Placement = room.Placement
                    },
                    Temperatures = temperatures.Select(t => new TemperatureDto
                    {
                        TempId = t.TempId,
                        RoomId = t.RoomId,
                        Hour = t.Hour,
                        Degrees = t.Degrees,
                        Date = t.Date
                    }).ToList()
                });
            }

            var result = new HouseTempDataResult
            {
                House = new HouseDto
                {
                    HouseId = house.HouseId,
                    Name = house.Name,
                    Area = house.Area
                },
                Date = searchDate,
                Rooms = roomTempData
            };

            return Ok(result);
        }

        [HttpGet("{id}/rooms")]
        public async Task<ActionResult<HouseRoomsResult>> GetHouseRooms(int id)
        {
            var house = await _houseDataService.GetHouseAsync(id);
            if (house == null)
            {
                return NotFound("House not found");
            }

            var rooms = await _houseDataService.GetRoomsByHouseAsync(id);

            var result = new HouseRoomsResult
            {
                House = new HouseDto
                {
                    HouseId = house.HouseId,
                    Name = house.Name,
                    Area = house.Area
                },
                Rooms = rooms.Select(room => new RoomDto
                {
                    RoomId = room.RoomId,
                    HouseId = room.HouseId,
                    Name = room.Name,
                    Type = room.Type,
                    Area = room.Area,
                    Placement = room.Placement
                }).ToList()
            };

            return Ok(result);
        }

        [HttpGet("/Houses")]
        public async Task<ActionResult<HousesResult>> GetHouses()
        {
            var houses = await _houseDataService.GetHousesAsync();

            var result = new HousesResult
            {
                Houses = houses.Select(house => new HouseDto
                {
                    HouseId = house.HouseId,
                    Name = house.Name,
                    Area = house.Area
                }).ToList()
            };

            return Ok(result);
        }

        [HttpGet("/HousesWithRooms")]
        public async Task<ActionResult<HousesWithRoomsResult>> GetHousesWithRooms()
        {
            var houses = await _houseDataService.GetHousesAsync();

            var result = new HousesWithRoomsResult
            {
                Houses = houses
                    .OrderBy(h => h.Name)
                    .Select(house => new HouseWithRoomsDto
                    {
                        HouseId = house.HouseId,
                        Name = house.Name,
                        Area = house.Area,
                        Rooms = house.Rooms.Select(room => new RoomDto
                        {
                            RoomId = room.RoomId,
                            HouseId = room.HouseId,
                            Name = room.Name,
                            Type = room.Type,
                            Area = room.Area,
                            Placement = room.Placement
                        }).ToList()
                    }).ToList()
            };

            return Ok(result);
        }
    }
}