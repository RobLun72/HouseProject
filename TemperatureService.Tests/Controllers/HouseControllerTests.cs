using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using TemperatureService.Controllers;
using TemperatureService.Data;
using TemperatureService.Models;
using TemperatureService.Services;

namespace TemperatureService.Tests.Controllers
{
    public class HouseControllerTests : IDisposable
    {
        private readonly TemperatureDbContext _context;
        private readonly HouseController _controller;
        private readonly IHouseDataService _houseDataService;
        private readonly Mock<ILogger<HouseController>> _mockLogger;

        protected TemperatureDbContext Context => _context;

        public HouseControllerTests()
        {
            // Create in-memory database
            var options = new DbContextOptionsBuilder<TemperatureDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TemperatureDbContext(options);

            // Seed test data
            SeedTestData();

            // Setup services
            var mockHouseDataLogger = new Mock<ILogger<HouseDataService>>();
            _houseDataService = new HouseDataService(_context, mockHouseDataLogger.Object);
            _mockLogger = new Mock<ILogger<HouseController>>();

            // Create controller
            _controller = new HouseController(_houseDataService, _mockLogger.Object);
        }

        private void SeedTestData()
        {
            var houses = new List<House>
            {
                new House
                {
                    HouseId = 1,
                    Name = "Main House",
                    Area = 150.5m,
                    Rooms = new List<Room>
                    {
                        new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 25.0m, Placement = "Ground Floor" },
                        new Room { RoomId = 2, HouseId = 1, Name = "Kitchen", Type = "Kitchen", Area = 15.0m, Placement = "Ground Floor" },
                        new Room { RoomId = 3, HouseId = 1, Name = "Master Bedroom", Type = "Bedroom", Area = 20.0m, Placement = "First Floor" }
                    }
                },
                new House
                {
                    HouseId = 2,
                    Name = "Guest House",
                    Area = 75.0m,
                    Rooms = new List<Room>
                    {
                        new Room { RoomId = 4, HouseId = 2, Name = "Guest Bedroom", Type = "Bedroom", Area = 18.0m, Placement = "Ground Floor" },
                        new Room { RoomId = 5, HouseId = 2, Name = "Guest Bathroom", Type = "Bathroom", Area = 8.0m, Placement = "Ground Floor" }
                    }
                }
            };

            _context.Houses.AddRange(houses);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetHousesWithRooms_ReturnsOkWithHousesAndRooms()
        {
            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            // Verify houses are ordered by name
            Assert.Equal(2, housesResult.Houses.Count);
            Assert.Equal("Guest House", housesResult.Houses[0].Name);
            Assert.Equal("Main House", housesResult.Houses[1].Name);
        }

        [Fact]
        public async Task GetHousesWithRooms_ReturnsCorrectHouseData()
        {
            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            var mainHouse = housesResult.Houses.First(h => h.Name == "Main House");
            Assert.Equal(1, mainHouse.HouseId);
            Assert.Equal("Main House", mainHouse.Name);
            Assert.Equal(150.5m, mainHouse.Area);
            Assert.Equal(3, mainHouse.Rooms.Count);

            // Verify room data
            var livingRoom = mainHouse.Rooms.First(r => r.Name == "Living Room");
            Assert.Equal(1, livingRoom.RoomId);
            Assert.Equal(1, livingRoom.HouseId);
            Assert.Equal("Living Room", livingRoom.Name);
            Assert.Equal("Living", livingRoom.Type);
            Assert.Equal(25.0m, livingRoom.Area);
            Assert.Equal("Ground Floor", livingRoom.Placement);
        }

        [Fact]
        public async Task GetHousesWithRooms_ReturnsCorrectGuestHouseData()
        {
            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            var guestHouse = housesResult.Houses.First(h => h.Name == "Guest House");
            Assert.Equal(2, guestHouse.HouseId);
            Assert.Equal("Guest House", guestHouse.Name);
            Assert.Equal(75.0m, guestHouse.Area);
            Assert.Equal(2, guestHouse.Rooms.Count);

            // Verify guest house rooms
            var guestBedroom = guestHouse.Rooms.First(r => r.Type == "Bedroom");
            Assert.Equal(4, guestBedroom.RoomId);
            Assert.Equal("Guest Bedroom", guestBedroom.Name);
            Assert.Equal(18.0m, guestBedroom.Area);
        }

        [Fact]
        public async Task GetHousesWithRooms_EmptyDatabase_ReturnsEmptyList()
        {
            // Arrange - Clear all data
            _context.Houses.RemoveRange(_context.Houses);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            Assert.Empty(housesResult.Houses);
        }

        [Fact]
        public async Task GetHousesWithRooms_HouseWithoutRooms_ReturnsHouseWithEmptyRoomsList()
        {
            // Arrange - Add a house without rooms
            var emptyHouse = new House
            {
                HouseId = 3,
                Name = "Empty House",
                Area = 50.0m,
                Rooms = new List<Room>()
            };
            _context.Houses.Add(emptyHouse);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            var emptyHouseResult = housesResult.Houses.FirstOrDefault(h => h.Name == "Empty House");
            Assert.NotNull(emptyHouseResult);
            Assert.Empty(emptyHouseResult.Rooms);
        }

        [Fact]
        public async Task GetHousesWithRooms_VerifiesOrderingByName()
        {
            // Arrange - Add more houses to test ordering
            var additionalHouses = new List<House>
            {
                new House { HouseId = 3, Name = "Alpha House", Area = 100.0m },
                new House { HouseId = 4, Name = "Zulu House", Area = 120.0m },
                new House { HouseId = 5, Name = "Beta House", Area = 80.0m }
            };
            _context.Houses.AddRange(additionalHouses);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetHousesWithRooms();

            // Assert
            var okResult = Assert.IsType<ActionResult<HousesWithRoomsResult>>(result);
            var actionResult = Assert.IsType<OkObjectResult>(okResult.Result);
            var housesResult = Assert.IsType<HousesWithRoomsResult>(actionResult.Value);

            // Verify alphabetical ordering
            var houseNames = housesResult.Houses.Select(h => h.Name).ToList();
            var expectedOrder = new[] { "Alpha House", "Beta House", "Guest House", "Main House", "Zulu House" };
            Assert.Equal(expectedOrder, houseNames);
        }

        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}