using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TemperatureService.Controllers;
using TemperatureService.Models;

namespace TemperatureService.Tests.Controllers;

public class TemperatureControllerTests : TestBase
{
    private readonly TemperatureController _controller;
    private readonly Mock<ILogger<TemperatureController>> _mockLogger;

    public TemperatureControllerTests()
    {
        _mockLogger = new Mock<ILogger<TemperatureController>>();
        _controller = new TemperatureController(Context, _mockLogger.Object);
    }

    [Fact]
    public async Task GetTemperatures_NoFilters_ReturnsAllTemperatures()
    {
        // Act
        var result = await _controller.GetTemperatures();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.Equal(6, temperatures.Count());
    }

    [Fact]
    public async Task GetTemperatures_WithDateFilter_ReturnsFilteredTemperatures()
    {
        // Arrange
        var filterDate = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperatures(filterDate);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => Assert.Equal(filterDate.Date, t.Date.Date));
    }

    [Fact]
    public async Task GetTemperatures_WithRoomIdFilter_ReturnsFilteredTemperatures()
    {
        // Arrange
        var roomId = 1;

        // Act
        var result = await _controller.GetTemperatures(null, roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => Assert.Equal(roomId, t.RoomId));
        Assert.Equal(3, temperatures.Count());
    }

    [Fact]
    public async Task GetTemperatures_WithBothFilters_ReturnsFilteredTemperatures()
    {
        // Arrange
        var filterDate = DateTime.UtcNow.Date;
        var roomId = 1;

        // Act
        var result = await _controller.GetTemperatures(filterDate, roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => 
        {
            Assert.Equal(filterDate.Date, t.Date.Date);
            Assert.Equal(roomId, t.RoomId);
        });
    }

    [Fact]
    public async Task GetTemperature_ExistingId_ReturnsOkWithTemperature()
    {
        // Arrange
        var tempId = 1;

        // Act
        var result = await _controller.GetTemperature(tempId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(okResult.Value);
        Assert.Equal(tempId, temperature.TempId);
    }

    [Fact]
    public async Task GetTemperature_NonExistentId_ReturnsNotFound()
    {
        // Arrange
        var tempId = 999;

        // Act
        var result = await _controller.GetTemperature(tempId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetTemperaturesByRoom_ExistingRoom_ReturnsTemperatures()
    {
        // Arrange
        var roomId = 1;

        // Act
        var result = await _controller.GetTemperaturesByRoom(roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => Assert.Equal(roomId, t.RoomId));
        Assert.Equal(3, temperatures.Count());
    }

    [Fact]
    public async Task GetTemperaturesByRoom_WithDateFilter_ReturnsFilteredTemperatures()
    {
        // Arrange
        var roomId = 1;
        var filterDate = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperaturesByRoom(roomId, filterDate);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => 
        {
            Assert.Equal(roomId, t.RoomId);
            Assert.Equal(filterDate.Date, t.Date.Date);
        });
    }

    [Fact]
    public async Task GetTemperaturesByRoom_NonExistentRoom_ReturnsEmptyList()
    {
        // Arrange
        var roomId = 999;

        // Act
        var result = await _controller.GetTemperaturesByRoom(roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.Empty(temperatures);
    }

    [Fact]
    public async Task GetTemperatureByRoomAndHour_ExistingData_ReturnsTemperature()
    {
        // Arrange
        var roomId = 1;
        var hour = 8;
        var date = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperatureByRoomAndHour(roomId, hour, date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(okResult.Value);
        Assert.Equal(roomId, temperature.RoomId);
        Assert.Equal(hour, temperature.Hour);
    }

    [Fact]
    public async Task GetTemperatureByRoomAndHour_NonExistentData_ReturnsNotFound()
    {
        // Arrange
        var roomId = 999;
        var hour = 8;

        // Act
        var result = await _controller.GetTemperatureByRoomAndHour(roomId, hour);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetTemperaturesByDate_ExistingDate_ReturnsTemperatures()
    {
        // Arrange
        var date = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperaturesByDate(date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => Assert.Equal(date.Date, t.Date.Date));
        Assert.Equal(6, temperatures.Count());
    }

    [Fact]
    public async Task GetTemperaturesByRoomAndDate_ExistingData_ReturnsTemperatures()
    {
        // Arrange
        var roomId = 1;
        var date = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperaturesByRoomAndDate(roomId, date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.All(temperatures, t => 
        {
            Assert.Equal(roomId, t.RoomId);
            Assert.Equal(date.Date, t.Date.Date);
        });
        Assert.Equal(3, temperatures.Count());
    }

    [Fact]
    public async Task GetTemperatureByRoomDateAndHour_ExistingData_ReturnsTemperature()
    {
        // Arrange
        var roomId = 1;
        var date = DateTime.UtcNow.Date;
        var hour = 8;

        // Act
        var result = await _controller.GetTemperatureByRoomDateAndHour(roomId, date, hour);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(okResult.Value);
        Assert.Equal(roomId, temperature.RoomId);
        Assert.Equal(date.Date, temperature.Date.Date);
        Assert.Equal(hour, temperature.Hour);
    }

    [Fact]
    public async Task GetTemperatureByRoomDateAndHour_NonExistentData_ReturnsNotFound()
    {
        // Arrange
        var roomId = 999;
        var date = DateTime.UtcNow.Date;
        var hour = 8;

        // Act
        var result = await _controller.GetTemperatureByRoomDateAndHour(roomId, date, hour);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateTemperature_ValidRequest_ReturnsCreatedWithTemperature()
    {
        // Arrange
        var request = new CreateTemperatureRequest
        {
            RoomId = 1,
            Hour = 20,
            Degrees = 25.5,
            Date = DateTime.UtcNow.Date
        };

        // Act
        var result = await _controller.CreateTemperature(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(createdResult.Value);
        Assert.Equal(request.RoomId, temperature.RoomId);
        Assert.Equal(request.Hour, temperature.Hour);
        Assert.Equal(request.Degrees, temperature.Degrees);
        Assert.Equal(request.Date.Date, temperature.Date.Date);
    }

    [Fact]
    public async Task CreateTemperature_NullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.CreateTemperature(null!);

        // Assert
        Assert.IsType<BadRequestResult>(result.Result);
    }

    [Fact]
    public async Task CreateTemperature_DuplicateReading_ReturnsConflict()
    {
        // Arrange - This should conflict with existing seeded data
        var request = new CreateTemperatureRequest
        {
            RoomId = 1,
            Hour = 8,
            Degrees = 25.5,
            Date = DateTime.UtcNow.Date
        };

        // Act
        var result = await _controller.CreateTemperature(request);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.Contains("Temperature reading already exists", conflictResult.Value?.ToString());
    }

    [Fact]
    public async Task CreateTemperature_DefaultDate_UsesTodayDate()
    {
        // Arrange
        var request = new CreateTemperatureRequest
        {
            RoomId = 2,
            Hour = 20,
            Degrees = 25.5,
            Date = default(DateTime) // This should default to today
        };

        // Act
        var result = await _controller.CreateTemperature(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(createdResult.Value);
        Assert.Equal(DateTime.UtcNow.Date, temperature.Date.Date);
    }

    [Fact]
    public async Task UpdateTemperature_ExistingTemperature_ReturnsNoContent()
    {
        // Arrange
        var tempId = 1;
        var request = new UpdateTemperatureRequest
        {
            RoomId = 1,
            Hour = 9,
            Degrees = 26.0,
            Date = DateTime.UtcNow.Date
        };

        // Act
        var result = await _controller.UpdateTemperature(tempId, request);

        // Assert
        Assert.IsType<NoContentResult>(result);

        // Verify the temperature was updated
        var updatedTemp = await Context.Temperatures.FindAsync(tempId);
        Assert.NotNull(updatedTemp);
        Assert.Equal(request.Hour, updatedTemp.Hour);
        Assert.Equal(request.Degrees, updatedTemp.Degrees);
    }

    [Fact]
    public async Task UpdateTemperature_NonExistentTemperature_ReturnsNotFound()
    {
        // Arrange
        var tempId = 999;
        var request = new UpdateTemperatureRequest
        {
            RoomId = 1,
            Hour = 9,
            Degrees = 26.0,
            Date = DateTime.UtcNow.Date
        };

        // Act
        var result = await _controller.UpdateTemperature(tempId, request);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task UpdateTemperature_NullRequest_ReturnsBadRequest()
    {
        // Arrange
        var tempId = 1;

        // Act
        var result = await _controller.UpdateTemperature(tempId, null!);

        // Assert
        Assert.IsType<BadRequestResult>(result);
    }

    [Fact]
    public async Task DeleteTemperature_ExistingTemperature_ReturnsNoContent()
    {
        // Arrange
        var tempId = 1;

        // Act
        var result = await _controller.DeleteTemperature(tempId);

        // Assert
        Assert.IsType<NoContentResult>(result);

        // Verify the temperature was deleted
        var deletedTemp = await Context.Temperatures.FindAsync(tempId);
        Assert.Null(deletedTemp);
    }

    [Fact]
    public async Task DeleteTemperature_NonExistentTemperature_ReturnsNotFound()
    {
        // Arrange
        var tempId = 999;

        // Act
        var result = await _controller.DeleteTemperature(tempId);

        // Assert
        Assert.IsType<NotFoundResult>(result);
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
        Assert.Equal("TemperatureService", serviceProperty?.GetValue(healthData));
        Assert.NotNull(timestampProperty?.GetValue(healthData));
    }
}