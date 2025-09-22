using TemperatureService.Models;
using TemperatureService.Data;
using Microsoft.EntityFrameworkCore;

namespace TemperatureService.Services
{
    public interface IHouseDataService
    {
        Task<IEnumerable<House>> GetHousesAsync();
        Task<House?> GetHouseAsync(int houseId);
        Task<House> CreateHouseAsync(House house);
        Task<House?> UpdateHouseAsync(int houseId, House house);
        Task<bool> DeleteHouseAsync(int houseId);
        
        Task<IEnumerable<Room>> GetRoomsAsync();
        Task<IEnumerable<Room>> GetRoomsByHouseAsync(int houseId);
        Task<Room?> GetRoomAsync(int roomId);
        Task<Room> CreateRoomAsync(Room room);
        Task<Room?> UpdateRoomAsync(int roomId, Room room);
        Task<bool> DeleteRoomAsync(int roomId);
    }

    public class HouseDataService : IHouseDataService
    {
        private readonly TemperatureDbContext _context;
        private readonly ILogger<HouseDataService> _logger;

        public HouseDataService(TemperatureDbContext context, ILogger<HouseDataService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<House>> GetHousesAsync()
        {
            return await _context.Houses
                .Include(h => h.Rooms)
                .ToListAsync();
        }

        public async Task<House?> GetHouseAsync(int houseId)
        {
            return await _context.Houses
                .Include(h => h.Rooms)
                .FirstOrDefaultAsync(h => h.HouseId == houseId);
        }

        public async Task<House> CreateHouseAsync(House house)
        {
            // Check if house already exists (for sync scenarios)
            var existingHouse = await _context.Houses
                .FirstOrDefaultAsync(h => h.HouseId == house.HouseId);
            
            if (existingHouse != null)
            {
                // Update existing house instead of creating duplicate
                existingHouse.Name = house.Name;
                existingHouse.Area = house.Area;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated existing house {HouseId}: {Name}", house.HouseId, house.Name);
                return existingHouse;
            }

            _context.Houses.Add(house);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created house {HouseId}: {Name}", house.HouseId, house.Name);
            return house;
        }

        public async Task<House?> UpdateHouseAsync(int houseId, House house)
        {
            var existingHouse = await _context.Houses.FindAsync(houseId);
            if (existingHouse == null)
            {
                return null;
            }

            existingHouse.Name = house.Name;
            existingHouse.Area = house.Area;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated house {HouseId}: {Name}", houseId, house.Name);
            return existingHouse;
        }

        public async Task<bool> DeleteHouseAsync(int houseId)
        {
            var house = await _context.Houses
                .Include(h => h.Rooms)
                .FirstOrDefaultAsync(h => h.HouseId == houseId);
            
            if (house == null)
            {
                return false;
            }

            _context.Houses.Remove(house);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted house {HouseId} and its {RoomCount} rooms", houseId, house.Rooms.Count);
            return true;
        }

        public async Task<IEnumerable<Room>> GetRoomsAsync()
        {
            return await _context.Rooms
                .Include(r => r.House)
                .Include(r => r.Temperatures)
                .ToListAsync();
        }

        public async Task<IEnumerable<Room>> GetRoomsByHouseAsync(int houseId)
        {
            return await _context.Rooms
                .Include(r => r.House)
                .Include(r => r.Temperatures)
                .Where(r => r.HouseId == houseId)
                .ToListAsync();
        }

        public async Task<Room?> GetRoomAsync(int roomId)
        {
            return await _context.Rooms
                .Include(r => r.House)
                .Include(r => r.Temperatures)
                .FirstOrDefaultAsync(r => r.RoomId == roomId);
        }

        public async Task<Room> CreateRoomAsync(Room room)
        {
            // Check if room already exists (for sync scenarios)
            var existingRoom = await _context.Rooms
                .FirstOrDefaultAsync(r => r.RoomId == room.RoomId);
            
            if (existingRoom != null)
            {
                // Update existing room instead of creating duplicate
                existingRoom.HouseId = room.HouseId;
                existingRoom.Area = room.Area;
                existingRoom.Placement = room.Placement;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated existing room {RoomId}: {Placement}", room.RoomId, room.Placement);
                return existingRoom;
            }

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Created room {RoomId}: {Placement} in house {HouseId}", room.RoomId, room.Placement, room.HouseId);
            return room;
        }

        public async Task<Room?> UpdateRoomAsync(int roomId, Room room)
        {
            var existingRoom = await _context.Rooms.FindAsync(roomId);
            if (existingRoom == null)
            {
                return null;
            }

            existingRoom.HouseId = room.HouseId;
            existingRoom.Area = room.Area;
            existingRoom.Placement = room.Placement;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated room {RoomId}: {Placement}", roomId, room.Placement);
            return existingRoom;
        }

        public async Task<bool> DeleteRoomAsync(int roomId)
        {
            var room = await _context.Rooms
                .Include(r => r.Temperatures)
                .FirstOrDefaultAsync(r => r.RoomId == roomId);
            
            if (room == null)
            {
                return false;
            }

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted room {RoomId}: {Placement}", roomId, room.Placement);
            return true;
        }
    }
}