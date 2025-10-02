using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HouseService.Services;
using HouseService.Data;
using HouseService.Models;
using HouseService.Attributes;
using HouseService.Entities;

namespace HouseService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [ApiKeyAuth]
    public class HouseController : ControllerBase
    {
        private readonly HouseDbContext _context;
        private readonly ILogger<HouseController> _logger;
        private readonly ITransactionalOutboxService _transactionalOutboxService;

        public HouseController(HouseDbContext context, ILogger<HouseController> logger, ITransactionalOutboxService transactionalOutboxService)
        {
            _context = context;
            _logger = logger;
            _transactionalOutboxService = transactionalOutboxService;
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
        public async Task<ActionResult<House>> CreateHouse(CreateHouseRequest request)
        {
            if (request == null)
            {
                return BadRequest();
            }

            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                var house = new House
                {
                    Name = request.Name,
                    Address = request.Address,
                    Area = request.Area
                };
                
                context.Houses.Add(house);
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateHouseCreatedEvent(house.HouseId, house.Name, house.Address, house.Area);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return CreatedAtAction(nameof(GetHouse), new { id = house.HouseId }, house);
            }, _context);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHouse(int id, UpdateHouseRequest request)
        {
            if (request == null)
            {
                return BadRequest();
            }

            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                var house = await context.Houses.FindAsync(id);
                if (house == null)
                {
                    return (IActionResult)NotFound();
                }

                // Update the house properties from the request
                house.Name = request.Name;
                house.Address = request.Address;
                house.Area = request.Area;

                context.Entry(house).State = EntityState.Modified;
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateHouseUpdatedEvent(house.HouseId, house.Name, house.Address, house.Area);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return (IActionResult)NoContent();
            }, _context);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHouse(int id)
        {
            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                var house = await context.Houses.FindAsync(id);
                if (house == null)
                {
                    return (IActionResult)NotFound();
                }

                context.Houses.Remove(house);
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateHouseDeletedEvent(id);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return (IActionResult)NoContent();
            }, _context);
        }

        private async Task<bool> HouseExists(int id)
        {
            return await _context.Houses.AnyAsync(e => e.HouseId == id);
        }
    }
}