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
    public async Task GetTemperaturesByRoomAndDate_NonExistentRoom_ReturnsEmptyList()
    {
        // Arrange
        var roomId = 999;
        var date = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperaturesByRoomAndDate(roomId, date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.Empty(temperatures);
    }

    [Fact]
    public async Task GetTemperaturesByRoomAndDate_FutureDate_ReturnsEmptyList()
    {
        // Arrange
        var roomId = 1;
        var futureDate = DateTime.UtcNow.Date.AddDays(10);

        // Act
        var result = await _controller.GetTemperaturesByRoomAndDate(roomId, futureDate);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value);
        Assert.Empty(temperatures);
    }

    [Fact]
    public async Task GetTemperaturesByRoomAndDate_ValidatesUtcDateHandling()
    {
        // Arrange
        var roomId = 1;
        var date = DateTime.UtcNow.Date;

        // Act
        var result = await _controller.GetTemperaturesByRoomAndDate(roomId, date);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var temperatures = Assert.IsAssignableFrom<IEnumerable<Temperature>>(okResult.Value).ToList();
        
        // Verify temperatures are ordered by hour
        var hours = temperatures.Select(t => t.Hour).ToList();
        Assert.Equal(hours.OrderBy(h => h), hours);
    }

    [Fact]
    public async Task GetAvailableDatesForRoom_ExistingRoom_ReturnsOrderedDates()
    {
        // Arrange
        var roomId = 1;

        // Act
        var result = await _controller.GetAvailableDatesForRoom(roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dates = Assert.IsAssignableFrom<IEnumerable<DateTime>>(okResult.Value).ToList();
        
        // Verify dates are in descending order (newest first)
        Assert.Equal(dates.OrderByDescending(d => d), dates);
        Assert.NotEmpty(dates);
    }

    [Fact]
    public async Task GetAvailableDatesForRoom_NonExistentRoom_ReturnsEmptyList()
    {
        // Arrange
        var roomId = 999;

        // Act
        var result = await _controller.GetAvailableDatesForRoom(roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dates = Assert.IsAssignableFrom<IEnumerable<DateTime>>(okResult.Value);
        Assert.Empty(dates);
    }

    [Fact]
    public async Task GetAvailableDatesForRoom_ReturnsDistinctDatesOnly()
    {
        // Arrange
        var roomId = 1;

        // Act
        var result = await _controller.GetAvailableDatesForRoom(roomId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dates = Assert.IsAssignableFrom<IEnumerable<DateTime>>(okResult.Value).ToList();
        
        // Verify no duplicate dates
        Assert.Equal(dates.Distinct().Count(), dates.Count);
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
        var createdResult = Assert.IsType<CreatedResult>(result.Result);
        var temperature = Assert.IsType<Temperature>(createdResult.Value);
        Assert.Equal(request.RoomId, temperature.RoomId);
        Assert.Equal(request.Hour, temperature.Hour);
        Assert.Equal(request.Degrees, temperature.Degrees);
        Assert.Equal(request.Date.Date, temperature.Date.Date);
        
        // Verify location header is set correctly
        Assert.Equal($"/Temperature/{temperature.TempId}", createdResult.Location);
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
        var createdResult = Assert.IsType<CreatedResult>(result.Result);
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