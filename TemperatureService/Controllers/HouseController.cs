using Microsoft.AspNetCore.Mvc;
using TemperatureService.Models;
using TemperatureService.Services;
using TemperatureService.Attributes;

namespace TemperatureService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [ApiKeyAuth]
    public class HouseController : ControllerBase
    {
        private readonly IHouseDataService _houseDataService;
        private readonly ILogger<HouseController> _logger;

        public HouseController(IHouseDataService houseDataService, ILogger<HouseController> logger)
        {
            _houseDataService = houseDataService;
            _logger = logger;
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