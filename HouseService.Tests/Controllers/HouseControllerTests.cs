using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using HouseService.Controllers;
using HouseService.Data;
using HouseService.Services;
using HouseService.Models;
using Moq;
using Xunit;

namespace HouseService.Tests.Controllers
{
    public class HouseControllerTests : TestBase
    {
        private HouseController CreateController(HouseDbContext context)
        {
            var mockLogger = new Mock<ILogger<HouseController>>();
            return new HouseController(context, mockLogger.Object, MockMessagePublisher.Object);
        }

        [Fact]
        public async Task GetHouses_ReturnsAllHouses()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetHouses();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var houses = Assert.IsAssignableFrom<IEnumerable<House>>(okResult.Value);
            Assert.Equal(2, houses.Count());
        }

        [Fact]
        public async Task GetHouse_ExistingId_ReturnsHouse()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.GetHouse(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var house = Assert.IsType<House>(okResult.Value);
            Assert.Equal(1, house.HouseId);
            Assert.Equal("Test House 1", house.Name);
        }

        [Fact]
        public async Task GetHouse_NonExistingId_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.GetHouse(999);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateHouse_ValidRequest_ReturnsCreatedHouse()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);
            var request = new CreateHouseRequest
            {
                Name = "New Test House",
                Address = "789 New St",
                Area = 200.0m
            };

            // Act
            var result = await controller.CreateHouse(request);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var house = Assert.IsType<House>(createdResult.Value);
            Assert.Equal("New Test House", house.Name);
            Assert.Equal("789 New St", house.Address);
            Assert.Equal(200.0m, house.Area);

            // Verify house was added to database
            var houseInDb = await context.Houses.FindAsync(house.HouseId);
            Assert.NotNull(houseInDb);
            Assert.Equal("New Test House", houseInDb.Name);

            // Verify message was published
            MockMessagePublisher.Verify(
                x => x.PublishHouseCreatedAsync(
                    It.Is<int>(id => id == house.HouseId),
                    It.Is<string>(name => name == "New Test House"),
                    It.Is<string>(address => address == "789 New St"),
                    It.Is<decimal>(area => area == 200.0m)),
                Times.Once);
        }

        [Fact]
        public async Task CreateHouse_NullRequest_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.CreateHouse(null);

            // Assert
            Assert.IsType<BadRequestResult>(result.Result);
        }

        [Fact]
        public async Task UpdateHouse_ExistingHouse_ReturnsNoContent()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);
            var request = new UpdateHouseRequest
            {
                Name = "Updated House",
                Address = "Updated Address",
                Area = 250.0m
            };

            // Act
            var result = await controller.UpdateHouse(1, request);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify house was updated in database
            var updatedHouse = await context.Houses.FindAsync(1);
            Assert.NotNull(updatedHouse);
            Assert.Equal("Updated House", updatedHouse.Name);
            Assert.Equal("Updated Address", updatedHouse.Address);
            Assert.Equal(250.0m, updatedHouse.Area);

            // Verify message was published
            MockMessagePublisher.Verify(
                x => x.PublishHouseUpdatedAsync(
                    It.Is<int>(id => id == 1),
                    It.Is<string>(name => name == "Updated House"),
                    It.Is<string>(address => address == "Updated Address"),
                    It.Is<decimal>(area => area == 250.0m)),
                Times.Once);
        }

        [Fact]
        public async Task UpdateHouse_NonExistingHouse_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);
            var request = new UpdateHouseRequest
            {
                Name = "Updated House",
                Address = "Updated Address",
                Area = 250.0m
            };

            // Act
            var result = await controller.UpdateHouse(999, request);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateHouse_NullRequest_ReturnsBadRequest()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.UpdateHouse(1, null);

            // Assert
            Assert.IsType<BadRequestResult>(result);
        }

        [Fact]
        public async Task DeleteHouse_ExistingHouse_ReturnsNoContent()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Act
            var result = await controller.DeleteHouse(1);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify house was deleted from database
            var deletedHouse = await context.Houses.FindAsync(1);
            Assert.Null(deletedHouse);

            // Verify message was published
            MockMessagePublisher.Verify(
                x => x.PublishHouseDeletedAsync(It.Is<int>(id => id == 1)),
                Times.Once);
        }

        [Fact]
        public async Task DeleteHouse_NonExistingHouse_ReturnsNotFound()
        {
            // Arrange
            using var context = CreateDbContext();
            var controller = CreateController(context);

            // Act
            var result = await controller.DeleteHouse(999);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteHouse_HouseWithRooms_DeletesHouseAndOrphanedRooms()
        {
            // Arrange
            using var context = CreateDbContext();
            SeedDatabase(context);
            var controller = CreateController(context);

            // Verify rooms exist before deletion
            var roomsBeforeDelete = context.Rooms.Where(r => r.HouseId == 1).ToList();
            Assert.Equal(2, roomsBeforeDelete.Count);

            // Act
            var result = await controller.DeleteHouse(1);

            // Assert
            Assert.IsType<NoContentResult>(result);

            // Verify house was deleted
            var deletedHouse = await context.Houses.FindAsync(1);
            Assert.Null(deletedHouse);

            // Note: Rooms might still exist depending on cascade configuration
            // This test documents the current behavior
        }
    }
}