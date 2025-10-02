using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TemperatureService.Controllers;
using TemperatureService.Models;
using TemperatureService.Services;

namespace TemperatureService.Tests.Controllers;

public class SyncControllerTests : TestBase
{
    private readonly SyncController _controller;
    private readonly Mock<ILogger<SyncController>> _mockLogger;

    public SyncControllerTests()
    {
        _mockLogger = new Mock<ILogger<SyncController>>();
        _controller = new SyncController(MockSyncService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_ValidMessage_ReturnsOkWithSuccessStatus()
    {
        // Arrange
        var syncMessage = new SyncMessage
        {
            EventType = "Created",
            EntityType = "House",
            Data = new TemperatureService.Models.HouseDto { HouseId = 1, Name = "Test House", Area = 150.0m },
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value;
        Assert.NotNull(response);
        
        // Use reflection to check the anonymous object properties
        var statusProperty = response.GetType().GetProperty("Status");
        var messageProperty = response.GetType().GetProperty("Message");
        
        Assert.Equal("Success", statusProperty?.GetValue(response));
        Assert.Equal("Sync message processed", messageProperty?.GetValue(response));

        // Verify the service was called
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(syncMessage), Times.Once);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_NullMessage_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.ReceiveHouseDataSync(null!);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Invalid sync message", badRequestResult.Value);

        // Verify the service was not called
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()), Times.Never);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var syncMessage = new SyncMessage
        {
            EventType = "Updated",
            EntityType = "Room",
            Data = new TemperatureService.Models.RoomDto 
            { 
                RoomId = 1, 
                HouseId = 1, 
                Name = "Living Room",
                Type = "Living",
                Area = 25.0m, 
                Placement = "Ground Floor" 
            },
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .ThrowsAsync(new Exception("Database connection failed"));

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, statusCodeResult.StatusCode);
        
        var response = statusCodeResult.Value;
        Assert.NotNull(response);
        
        // Use reflection to check the anonymous object properties
        var statusProperty = response.GetType().GetProperty("Status");
        var messageProperty = response.GetType().GetProperty("Message");
        
        Assert.Equal("Error", statusProperty?.GetValue(response));
        Assert.Equal("Failed to process sync message", messageProperty?.GetValue(response));

        // Verify the service was called
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(syncMessage), Times.Once);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_HouseCreatedMessage_ProcessesCorrectly()
    {
        // Arrange
        var houseData = new TemperatureService.Models.HouseDto 
        { 
            HouseId = 5, 
            Name = "New House", 
            Area = 180.0m 
        };
        
        var syncMessage = new SyncMessage
        {
            EventType = "Created",
            EntityType = "House",
            Data = houseData,
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Verify the correct message was passed to the service
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(It.Is<SyncMessage>(
            msg => msg.EventType == "Created" && 
                   msg.EntityType == "House" && 
                   msg.Data == houseData)), Times.Once);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_RoomUpdatedMessage_ProcessesCorrectly()
    {
        // Arrange
        var roomData = new TemperatureService.Models.RoomDto 
        { 
            RoomId = 3, 
            HouseId = 1, 
            Name = "Kitchen",
            Type = "Kitchen",
            Area = 30.0m, 
            Placement = "Updated Kitchen" 
        };
        
        var syncMessage = new SyncMessage
        {
            EventType = "Updated",
            EntityType = "Room",
            Data = roomData,
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Verify the correct message was passed to the service
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(It.Is<SyncMessage>(
            msg => msg.EventType == "Updated" && 
                   msg.EntityType == "Room" && 
                   msg.Data == roomData)), Times.Once);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_HouseDeletedMessage_ProcessesCorrectly()
    {
        // Arrange
        var houseData = new TemperatureService.Models.HouseDto 
        { 
            HouseId = 2, 
            Name = "House to Delete", 
            Area = 120.0m 
        };
        
        var syncMessage = new SyncMessage
        {
            EventType = "Deleted",
            EntityType = "House",
            Data = houseData,
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);

        // Verify the correct message was passed to the service
        MockSyncService.Verify(x => x.ProcessSyncMessageAsync(It.Is<SyncMessage>(
            msg => msg.EventType == "Deleted" && 
                   msg.EntityType == "House" && 
                   msg.Data == houseData)), Times.Once);
    }

    [Fact]
    public void HealthCheck_Always_ReturnsOkWithHealthStatus()
    {
        // Act
        var result = _controller.HealthCheck();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var healthData = okResult.Value;
        Assert.NotNull(healthData);
        
        // Use reflection to check the anonymous object properties
        var statusProperty = healthData.GetType().GetProperty("Status");
        var serviceProperty = healthData.GetType().GetProperty("Service");
        var timestampProperty = healthData.GetType().GetProperty("Timestamp");
        
        Assert.Equal("Healthy", statusProperty?.GetValue(healthData));
        Assert.Equal("TemperatureService-Sync", serviceProperty?.GetValue(healthData));
        Assert.NotNull(timestampProperty?.GetValue(healthData));
    }

    [Fact]
    public async Task ReceiveHouseDataSync_LogsInformationOnSuccess()
    {
        // Arrange
        var syncMessage = new SyncMessage
        {
            EventType = "Created",
            EntityType = "House",
            Data = new TemperatureService.Models.HouseDto { HouseId = 1, Name = "Test House", Area = 150.0m },
            Timestamp = DateTime.UtcNow
        };

        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        
        // Verify that information was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Successfully processed sync message")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ReceiveHouseDataSync_LogsErrorOnException()
    {
        // Arrange
        var syncMessage = new SyncMessage
        {
            EventType = "Updated",
            EntityType = "Room",
            Data = new TemperatureService.Models.RoomDto 
            { 
                RoomId = 1, 
                HouseId = 1, 
                Name = "Living Room",
                Type = "Living",
                Area = 25.0m, 
                Placement = "Ground Floor" 
            },
            Timestamp = DateTime.UtcNow
        };

        var exception = new Exception("Test exception");
        MockSyncService.Setup(x => x.ProcessSyncMessageAsync(It.IsAny<SyncMessage>()))
                      .ThrowsAsync(exception);

        // Act
        var result = await _controller.ReceiveHouseDataSync(syncMessage);

        // Assert
        Assert.IsType<ObjectResult>(result);
        
        // Verify that error was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error processing sync message")),
                exception,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
