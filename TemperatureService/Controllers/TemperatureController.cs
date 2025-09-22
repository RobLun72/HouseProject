using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TemperatureService.Data;

namespace TemperatureService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TemperatureController : ControllerBase
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<TemperatureController> _logger;

        public TemperatureController(TemperatureDbContext context, ILogger<TemperatureController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Temperature>>> GetTemperatures([FromQuery] DateTime? date = null, [FromQuery] int? roomId = null)
        {
            var query = _context.Temperatures.AsQueryable();
            
            if (date.HasValue)
            {
                query = query.Where(t => t.Date.Date == date.Value.Date);
            }
            
            if (roomId.HasValue)
            {
                query = query.Where(t => t.RoomId == roomId.Value);
            }
            
            return Ok(await query.OrderBy(t => t.Date).ThenBy(t => t.Hour).ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Temperature>> GetTemperature(int id)
        {
            var temperature = await _context.Temperatures.FindAsync(id);
            if (temperature == null)
            {
                return NotFound();
            }
            return Ok(temperature);
        }

        [HttpGet("room/{roomId}")]
        public async Task<ActionResult<IEnumerable<Temperature>>> GetTemperaturesByRoom(int roomId, [FromQuery] DateTime? date = null)
        {
            var query = _context.Temperatures.Where(t => t.RoomId == roomId);
            
            if (date.HasValue)
            {
                query = query.Where(t => t.Date.Date == date.Value.Date);
            }
            
            var temperatures = await query.OrderBy(t => t.Date).ThenBy(t => t.Hour).ToListAsync();
            return Ok(temperatures);
        }

        [HttpGet("room/{roomId}/hour/{hour}")]
        public async Task<ActionResult<Temperature>> GetTemperatureByRoomAndHour(int roomId, int hour, [FromQuery] DateTime? date = null)
        {
            var query = _context.Temperatures.Where(t => t.RoomId == roomId && t.Hour == hour);
            
            if (date.HasValue)
            {
                query = query.Where(t => t.Date.Date == date.Value.Date);
            }
            else
            {
                // If no date specified, get the most recent reading
                query = query.OrderByDescending(t => t.Date);
            }
            
            var temperature = await query.FirstOrDefaultAsync();
            if (temperature == null)
            {
                return NotFound();
            }
            return Ok(temperature);
        }

        [HttpGet("date/{date:datetime}")]
        public async Task<ActionResult<IEnumerable<Temperature>>> GetTemperaturesByDate(DateTime date)
        {
            var temperatures = await _context.Temperatures
                .Where(t => t.Date.Date == date.Date)
                .OrderBy(t => t.RoomId)
                .ThenBy(t => t.Hour)
                .ToListAsync();
            return Ok(temperatures);
        }

        [HttpGet("room/{roomId}/date/{date:datetime}")]
        public async Task<ActionResult<IEnumerable<Temperature>>> GetTemperaturesByRoomAndDate(int roomId, DateTime date)
        {
            var temperatures = await _context.Temperatures
                .Where(t => t.RoomId == roomId && t.Date.Date == date.Date)
                .OrderBy(t => t.Hour)
                .ToListAsync();
            return Ok(temperatures);
        }

        [HttpGet("room/{roomId}/date/{date:datetime}/hour/{hour}")]
        public async Task<ActionResult<Temperature>> GetTemperatureByRoomDateAndHour(int roomId, DateTime date, int hour)
        {
            var temperature = await _context.Temperatures
                .FirstOrDefaultAsync(t => t.RoomId == roomId && t.Date.Date == date.Date && t.Hour == hour);
            if (temperature == null)
            {
                return NotFound();
            }
            return Ok(temperature);
        }

        [HttpPost]
        public async Task<ActionResult<Temperature>> CreateTemperature(Temperature temperature)
        {
            if (temperature == null)
            {
                return BadRequest();
            }

            // Set date to today if not provided
            if (temperature.Date == default(DateTime))
            {
                temperature.Date = DateTime.UtcNow.Date;
            }

            // Check if temperature reading already exists for this room, hour, and date
            var existingTemp = await _context.Temperatures
                .FirstOrDefaultAsync(t => t.RoomId == temperature.RoomId && 
                                        t.Hour == temperature.Hour && 
                                        t.Date.Date == temperature.Date.Date);
            if (existingTemp != null)
            {
                return Conflict("Temperature reading already exists for this room, hour, and date");
            }

            _context.Temperatures.Add(temperature);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTemperature), new { id = temperature.TempId }, temperature);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTemperature(int id, Temperature temperature)
        {
            if (id != temperature.TempId)
            {
                return BadRequest();
            }

            _context.Entry(temperature).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await TemperatureExists(id))
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
        public async Task<IActionResult> DeleteTemperature(int id)
        {
            var temperature = await _context.Temperatures.FindAsync(id);
            if (temperature == null)
            {
                return NotFound();
            }

            _context.Temperatures.Remove(temperature);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { Status = "Healthy", Service = "TemperatureService", Timestamp = DateTime.UtcNow });
        }

        private async Task<bool> TemperatureExists(int id)
        {
            return await _context.Temperatures.AnyAsync(e => e.TempId == id);
        }
    }
}