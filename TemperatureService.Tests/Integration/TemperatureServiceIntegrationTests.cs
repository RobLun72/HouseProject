using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text;
using System.Text.Json;
using TemperatureService.Models;

namespace TemperatureService.Tests.Integration;

public class TemperatureServiceIntegrationTests : IClassFixture<TestBase.TestWebApplicationFactory>
{
    private readonly TestBase.TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public TemperatureServiceIntegrationTests(TestBase.TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        // Add API key header for authenticated requests
        _client.DefaultRequestHeaders.Add("X-Api-Key", "dev-key-123456789");
    }

    [Fact]
    public async Task GetTemperatures_WithValidApiKey_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/Temperature");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var temperatures = JsonSerializer.Deserialize<Temperature[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(temperatures);
        Assert.NotEmpty(temperatures);
    }

    [Fact]
    public async Task GetTemperatures_WithoutApiKey_ReturnsUnauthorized()
    {
        // Arrange
        using var client = _factory.CreateClient();
        // Don't add API key header

        // Act
        var response = await client.GetAsync("/Temperature");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetTemperature_ExistingId_ReturnsTemperature()
    {
        // Act
        var response = await _client.GetAsync("/Temperature/1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var temperature = JsonSerializer.Deserialize<Temperature>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(temperature);
        Assert.Equal(1, temperature.TempId);
    }

    [Fact]
    public async Task GetTemperature_NonExistentId_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/Temperature/999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetTemperaturesByRoom_ExistingRoom_ReturnsTemperatures()
    {
        // Act
        var response = await _client.GetAsync("/Temperature/room/1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var temperatures = JsonSerializer.Deserialize<Temperature[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(temperatures);
        Assert.All(temperatures, t => Assert.Equal(1, t.RoomId));
    }

    [Fact]
    public async Task GetTemperaturesByDate_TodaysDate_ReturnsTemperatures()
    {
        // Arrange
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

        // Act
        var response = await _client.GetAsync($"/Temperature/date/{today}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var temperatures = JsonSerializer.Deserialize<Temperature[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(temperatures);
    }

    [Fact]
    public async Task CreateTemperature_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var request = new CreateTemperatureRequest
        {
            RoomId = 1,
            Hour = 21,
            Degrees = 24.5,
            Date = DateTime.UtcNow.Date
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/Temperature", content);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        var temperature = JsonSerializer.Deserialize<Temperature>(responseContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(temperature);
        Assert.Equal(request.RoomId, temperature.RoomId);
        Assert.Equal(request.Hour, temperature.Hour);
        Assert.Equal(request.Degrees, temperature.Degrees);
    }

    [Fact]
    public async Task CreateTemperature_DuplicateReading_ReturnsConflict()
    {
        // Arrange - First create a temperature reading
        var date = DateTime.UtcNow.Date;
        var initialRequest = new CreateTemperatureRequest
        {
            RoomId = 1,
            Hour = 22, // Use a unique hour to avoid conflicts with seeded data
            Degrees = 24.5,
            Date = date
        };

        var initialJson = JsonSerializer.Serialize(initialRequest);
        var initialContent = new StringContent(initialJson, Encoding.UTF8, "application/json");

        // Act 1 - Create the initial temperature reading
        var initialResponse = await _client.PostAsync("/Temperature", initialContent);
        Assert.Equal(HttpStatusCode.Created, initialResponse.StatusCode);

        // Arrange - Now try to create the same reading again (this should conflict)
        var duplicateRequest = new CreateTemperatureRequest
        {
            RoomId = 1,
            Hour = 22, // Same room, hour, and date
            Degrees = 25.0, // Different temperature value but same key
            Date = date
        };

        var duplicateJson = JsonSerializer.Serialize(duplicateRequest);
        var duplicateContent = new StringContent(duplicateJson, Encoding.UTF8, "application/json");

        // Act 2 - Try to create duplicate
        var duplicateResponse = await _client.PostAsync("/Temperature", duplicateContent);

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateTemperature_ExistingTemperature_ReturnsNoContent()
    {
        // Arrange
        var request = new UpdateTemperatureRequest
        {
            RoomId = 1,
            Hour = 9,
            Degrees = 26.5,
            Date = DateTime.UtcNow.Date
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PutAsync("/Temperature/1", content);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task UpdateTemperature_NonExistentTemperature_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateTemperatureRequest
        {
            RoomId = 1,
            Hour = 9,
            Degrees = 26.5,
            Date = DateTime.UtcNow.Date
        };

        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PutAsync("/Temperature/999", content);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTemperature_ExistingTemperature_ReturnsNoContent()
    {
        // Act
        var response = await _client.DeleteAsync("/Temperature/2");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteTemperature_NonExistentTemperature_ReturnsNotFound()
    {
        // Act
        var response = await _client.DeleteAsync("/Temperature/999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task HealthCheck_Temperature_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/Temperature/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
        Assert.Contains("TemperatureService", content);
    }

    [Fact]
    public async Task SyncController_HealthCheck_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/Sync/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
        Assert.Contains("TemperatureService-Sync", content);
    }

    [Fact]
    public async Task SyncController_ReceiveHouseDataSync_ValidMessage_ReturnsSuccess()
    {
        // Arrange
        var syncMessage = new SyncMessage
        {
            EventType = "Created",
            EntityType = "House",
            Data = new { HouseId = 5, Name = "Integration Test House", Area = 180.0 },
            Timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(syncMessage);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/Sync/house-data", content);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        Assert.Contains("Success", responseContent);
    }

    [Fact]
    public async Task FullCrudWorkflow_Temperature_Success()
    {
        // 1. Create a new temperature reading
        var createRequest = new CreateTemperatureRequest
        {
            RoomId = 2,
            Hour = 22,
            Degrees = 23.8,
            Date = DateTime.UtcNow.Date
        };

        var createJson = JsonSerializer.Serialize(createRequest);
        var createContent = new StringContent(createJson, Encoding.UTF8, "application/json");
        var createResponse = await _client.PostAsync("/Temperature", createContent);
        
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        
        var createdTempContent = await createResponse.Content.ReadAsStringAsync();
        var createdTemp = JsonSerializer.Deserialize<Temperature>(createdTempContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        Assert.NotNull(createdTemp);
        var tempId = createdTemp.TempId;

        // 2. Get the created temperature
        var getResponse = await _client.GetAsync($"/Temperature/{tempId}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        // 3. Update the temperature
        var updateRequest = new UpdateTemperatureRequest
        {
            RoomId = 2,
            Hour = 22,
            Degrees = 24.2,
            Date = DateTime.UtcNow.Date
        };

        var updateJson = JsonSerializer.Serialize(updateRequest);
        var updateContent = new StringContent(updateJson, Encoding.UTF8, "application/json");
        var updateResponse = await _client.PutAsync($"/Temperature/{tempId}", updateContent);
        
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        // 4. Verify the update
        var verifyResponse = await _client.GetAsync($"/Temperature/{tempId}");
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);
        
        var verifyContent = await verifyResponse.Content.ReadAsStringAsync();
        var updatedTemp = JsonSerializer.Deserialize<Temperature>(verifyContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        Assert.Equal(24.2, updatedTemp!.Degrees);

        // 5. Delete the temperature
        var deleteResponse = await _client.DeleteAsync($"/Temperature/{tempId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // 6. Verify deletion
        var deletedCheckResponse = await _client.GetAsync($"/Temperature/{tempId}");
        Assert.Equal(HttpStatusCode.NotFound, deletedCheckResponse.StatusCode);
    }

    [Fact]
    public async Task GetTemperatures_WithQueryParameters_FiltersCorrectly()
    {
        // Test with room filter
        var roomResponse = await _client.GetAsync("/Temperature?roomId=1");
        Assert.Equal(HttpStatusCode.OK, roomResponse.StatusCode);
        
        var roomContent = await roomResponse.Content.ReadAsStringAsync();
        var roomTemperatures = JsonSerializer.Deserialize<Temperature[]>(roomContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        Assert.All(roomTemperatures!, t => Assert.Equal(1, t.RoomId));

        // Test with date filter
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var dateResponse = await _client.GetAsync($"/Temperature?date={today}");
        Assert.Equal(HttpStatusCode.OK, dateResponse.StatusCode);

        // Test with both filters
        var bothResponse = await _client.GetAsync($"/Temperature?roomId=1&date={today}");
        Assert.Equal(HttpStatusCode.OK, bothResponse.StatusCode);
        
        var bothContent = await bothResponse.Content.ReadAsStringAsync();
        var bothTemperatures = JsonSerializer.Deserialize<Temperature[]>(bothContent, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        Assert.All(bothTemperatures!, t => Assert.Equal(1, t.RoomId));
    }
}