using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HouseService.Services;
using HouseService.Data;

namespace HouseService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HouseController : ControllerBase
    {
        private readonly HouseDbContext _context;
        private readonly ILogger<HouseController> _logger;
        private readonly INotificationService _notificationService;

        public HouseController(HouseDbContext context, ILogger<HouseController> logger, INotificationService notificationService)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<House>>> GetHouses()
        {
            return Ok(await _context.Houses.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<House>> GetHouse(int id)
        {
            var house = await _context.Houses.FindAsync(id);
            if (house == null)
            {
                return NotFound();
            }
            return Ok(house);
        }

        [HttpPost]
        public async Task<ActionResult<House>> CreateHouse(House house)
        {
            if (house == null)
            {
                return BadRequest();
            }

            _context.Houses.Add(house);
            await _context.SaveChangesAsync();
            
            // Notify TemperatureService about the new house
            await _notificationService.NotifyHouseCreatedAsync(house);
            
            return CreatedAtAction(nameof(GetHouse), new { id = house.HouseId }, house);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHouse(int id, House house)
        {
            if (id != house.HouseId)
            {
                return BadRequest();
            }

            _context.Entry(house).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                
                // Notify TemperatureService about the updated house
                await _notificationService.NotifyHouseUpdatedAsync(house);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await HouseExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHouse(int id)
        {
            var house = await _context.Houses.FindAsync(id);
            if (house == null)
            {
                return NotFound();
            }

            _context.Houses.Remove(house);
            await _context.SaveChangesAsync();
            
            // Notify TemperatureService about the deleted house
            await _notificationService.NotifyHouseDeletedAsync(id);
            
            return NoContent();
        }

        private async Task<bool> HouseExists(int id)
        {
            return await _context.Houses.AnyAsync(e => e.HouseId == id);
        }
    }
}