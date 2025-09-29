using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using HouseService.Controllers;
using HouseService.Data;
using HouseService.Services;
using HouseService.Models;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace HouseService.Tests.Controllers
{
    public class RoomControllerTests : TestBase
    {
        private RoomController CreateController(HouseDbContext context)
        {
            var mockLogger = new Mock<ILogger<RoomController>>();
            var outboxService = new OutboxService();
            var transactionalOutboxService = new TransactionalOutboxService(outboxService);
            return new RoomController(context, mockLogger.Object, transactionalOutboxService);
        }

        [Fact]
        public async Task GetRooms_ReturnsAllRooms()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetRooms();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var rooms = Assert.IsAssignableFrom<IEnumerable<Room>>(okResult.Value);
            Assert.Equal(3, rooms.Count());
        }

        [Fact]
        public async Task GetRoom_ExistingId_ReturnsRoom()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetRoom(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var room = Assert.IsType<Room>(okResult.Value);
            Assert.Equal(1, room.RoomId);
            Assert.Equal("Living Room", room.Name);
        }

        [Fact]
        public async Task GetRoom_NonExistingId_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.GetRoom(999);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task GetRoomsByHouse_ExistingHouse_ReturnsRoomsForHouse()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetRoomsByHouse(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var rooms = Assert.IsAssignableFrom<IEnumerable<Room>>(okResult.Value);
            Assert.Equal(2, rooms.Count());
            Assert.All(rooms, room => Assert.Equal(1, room.HouseId));
        }

        [Fact]
        public async Task GetRoomsByHouse_NonExistingHouse_ReturnsEmptyList()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetRoomsByHouse(999);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var rooms = Assert.IsAssignableFrom<IEnumerable<Room>>(okResult.Value);
            Assert.Empty(rooms);
        }

        [Fact]
        public async Task CreateRoom_ValidRequest_ReturnsCreatedRoom()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);
            var request = new CreateRoomRequest
            {
                HouseId = 1,
                Name = "New Bathroom",
                Type = "Bathroom",
                Area = 15.0m,
                Placement = "Ground Floor"
            };

            // Act
            var result = await controller.CreateRoom(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var room = Assert.IsType<Room>(createdResult.Value);
            Assert.Equal("New Bathroom", room.Name);
            Assert.Equal("Bathroom", room.Type);
            Assert.Equal(15.0m, room.Area);
            Assert.Equal(1, room.HouseId);

            // Verify room was added to database
            var roomInDb = await context.Rooms.FindAsync(room.RoomId);
            Assert.NotNull(roomInDb);
            Assert.Equal("New Bathroom", roomInDb.Name);

            // Verify outbox event was created
            var outboxEvents = await context.OutboxEvents.ToListAsync();
            Assert.Single(outboxEvents);
            Assert.Equal("RoomCreated", outboxEvents[0].EventType);
        }

        [Fact]
        public async Task CreateRoom_NonExistingHouse_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);
            var request = new CreateRoomRequest
            {
                HouseId = 999,
                Name = "New Room",
                Type = "Living",
                Area = 20.0m,
                Placement = "Ground Floor"
            };

            // Act
            var result = await controller.CreateRoom(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("House not found", badRequestResult.Value);
        }

        [Fact]
        public async Task CreateRoom_NullRequest_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.CreateRoom(null);

            // Assert
            Assert.IsType<BadRequestResult>(result.Result);
        }

        [Fact]
        public async Task UpdateRoom_ExistingRoom_ReturnsNoContent()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);
            var request = new UpdateRoomRequest
            {
                HouseId = 1,
                Name = "Updated Living Room",
                Type = "Living",
                Area = 60.0m,
                Placement = "Updated Floor"
            };

            // Act
            var result = await controller.UpdateRoom(1, request);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify room was updated in database
            var updatedRoom = await context.Rooms.FindAsync(1);
            Assert.NotNull(updatedRoom);
            Assert.Equal("Updated Living Room", updatedRoom.Name);
            Assert.Equal(60.0m, updatedRoom.Area);
            Assert.Equal("Updated Floor", updatedRoom.Placement);

            // Verify outbox event was created
            var outboxEvents = await context.OutboxEvents.ToListAsync();
            Assert.Single(outboxEvents);
            Assert.Equal("RoomUpdated", outboxEvents[0].EventType);
        }

        [Fact]
        public async Task UpdateRoom_NonExistingRoom_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);
            var request = new UpdateRoomRequest
            {
                HouseId = 1,
                Name = "Updated Room",
                Type = "Living",
                Area = 50.0m,
                Placement = "Ground Floor"
            };

            // Act
            var result = await controller.UpdateRoom(999, request);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateRoom_NonExistingHouse_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);
            var request = new UpdateRoomRequest
            {
                HouseId = 999,
                Name = "Updated Room",
                Type = "Living",
                Area = 50.0m,
                Placement = "Ground Floor"
            };

            // Act
            var result = await controller.UpdateRoom(1, request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("House not found", badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateRoom_NullRequest_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.UpdateRoom(1, null);

            // Assert
            Assert.IsType<BadRequestResult>(result);
        }

        [Fact]
        public async Task DeleteRoom_ExistingRoom_ReturnsNoContent()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.DeleteRoom(1);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify room was deleted from database
            var deletedRoom = await context.Rooms.FindAsync(1);
            Assert.Null(deletedRoom);

            // Verify outbox event was created
            var outboxEvents = await context.OutboxEvents.ToListAsync();
            Assert.Single(outboxEvents);
            Assert.Equal("RoomDeleted", outboxEvents[0].EventType);
        }

        [Fact]
        public async Task DeleteRoom_NonExistingRoom_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.DeleteRoom(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task CreateRoom_ValidRequestWithSameNameInDifferentHouse_Success()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);
            var request = new CreateRoomRequest
            {
                HouseId = 2,
                Name = "Living Room", // Same name as existing room in house 1
                Type = "Living",
                Area = 45.0m,
                Placement = "Ground Floor"
            };

            // Act
            var result = await controller.CreateRoom(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var room = Assert.IsType<Room>(createdResult.Value);
            Assert.Equal("Living Room", room.Name);
            Assert.Equal(2, room.HouseId);

            // Verify both rooms exist
            var roomsWithSameName = context.Rooms.Where(r => r.Name == "Living Room").ToList();
            Assert.Equal(2, roomsWithSameName.Count);
        }
    }
}
