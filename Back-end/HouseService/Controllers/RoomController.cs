using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HouseService.Services;
using HouseService.Data;
using HouseService.Models;
using HouseService.Attributes;

namespace HouseService.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [ApiKeyAuth]
    public class RoomController : ControllerBase
    {
        private readonly HouseDbContext _context;
        private readonly ILogger<RoomController> _logger;
        private readonly ITransactionalOutboxService _transactionalOutboxService;

        public RoomController(HouseDbContext context, ILogger<RoomController> logger, ITransactionalOutboxService transactionalOutboxService)
        {
            _context = context;
            _logger = logger;
            _transactionalOutboxService = transactionalOutboxService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Room>>> GetRooms()
        {
            return Ok(await _context.Rooms.ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Room>> GetRoom(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
            {
                return NotFound();
            }
            return Ok(room);
        }

        [HttpGet("house/{houseId}")]
        public async Task<ActionResult<IEnumerable<Room>>> GetRoomsByHouse(int houseId)
        {
            var rooms = await _context.Rooms
                .Where(r => r.HouseId == houseId)
                .ToListAsync();
            return Ok(rooms);
        }

        [HttpPost]
        public async Task<ActionResult<Room>> CreateRoom(CreateRoomRequest request)
        {
            if (request == null)
            {
                return BadRequest();
            }

            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                // Verify the house exists
                var house = await context.Houses.FindAsync(request.HouseId);
                if (house == null)
                {
                    return (ActionResult<Room>)BadRequest("House not found");
                }

                var room = new Room
                {
                    HouseId = request.HouseId,
                    Name = request.Name,
                    Type = request.Type,
                    Area = request.Area,
                    Placement = request.Placement
                };

                context.Rooms.Add(room);
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateRoomCreatedEvent(room.RoomId, room.HouseId, room.Name, room.Type, room.Area, room.Placement);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return (ActionResult<Room>)CreatedAtAction(nameof(GetRoom), new { id = room.RoomId }, room);
            }, _context);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, UpdateRoomRequest request)
        {
            if (request == null)
            {
                return BadRequest();
            }

            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                var room = await context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return (IActionResult)NotFound();
                }

                // Verify the house exists
                var house = await context.Houses.FindAsync(request.HouseId);
                if (house == null)
                {
                    return (IActionResult)BadRequest("House not found");
                }

                // Update the room properties from the request
                room.HouseId = request.HouseId;
                room.Name = request.Name;
                room.Type = request.Type;
                room.Area = request.Area;
                room.Placement = request.Placement;

                context.Entry(room).State = EntityState.Modified;
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateRoomUpdatedEvent(room.RoomId, room.HouseId, room.Name, room.Type, room.Area, room.Placement);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return (IActionResult)NoContent();
            }, _context);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            return await _transactionalOutboxService.ExecuteInTransactionAsync(async (context, outboxService) =>
            {
                var room = await context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return (IActionResult)NotFound();
                }

                context.Rooms.Remove(room);
                await context.SaveChangesAsync();
                
                // Create outbox event in the same transaction
                var outboxEvent = outboxService.CreateRoomDeletedEvent(id);
                context.OutboxEvents.Add(outboxEvent);
                await context.SaveChangesAsync();
                
                return (IActionResult)NoContent();
            }, _context);
        }

        private async Task<bool> RoomExists(int id)
        {
            return await _context.Rooms.AnyAsync(e => e.RoomId == id);
        }
    }
}