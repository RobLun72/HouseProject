using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using HouseService.Data;
using HouseService.Models;
using System.Net.Http.Json;
using System.Net;
using Xunit;

namespace HouseService.Tests.Integration
{
    public class HouseServiceIntegrationTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly TestWebApplicationFactory _factory;

        public HouseServiceIntegrationTests(TestWebApplicationFactory factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            
            // Add API key header for authentication
            _client.DefaultRequestHeaders.Add("X-Api-Key", "dev-key-123456789");
        }

        private async Task SeedDatabase()
        {
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<HouseDbContext>();
            
            // Clear existing data
            context.Rooms.RemoveRange(context.Rooms);
            context.Houses.RemoveRange(context.Houses);
            await context.SaveChangesAsync();

            // Add test data
            var houses = new[]
            {
                new House { HouseId = 1, Name = "Integration Test House 1", Address = "123 Test St", Area = 100.0m },
                new House { HouseId = 2, Name = "Integration Test House 2", Address = "456 Test Ave", Area = 150.0m }
            };

            var rooms = new[]
            {
                new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 50.0m, Placement = "Ground Floor" },
                new Room { RoomId = 2, HouseId = 1, Name = "Kitchen", Type = "Kitchen", Area = 30.0m, Placement = "Ground Floor" }
            };

            context.Houses.AddRange(houses);
            context.Rooms.AddRange(rooms);
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetHouses_WithoutApiKey_ReturnsUnauthorized()
        {
            // Arrange
            var clientWithoutAuth = _factory.CreateClient();

            // Act
            var response = await clientWithoutAuth.GetAsync("/House");

            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetHouses_WithValidApiKey_ReturnsOk()
        {
            // Arrange
            await SeedDatabase();

            // Act
            var response = await _client.GetAsync("/House");

            // Assert
            response.EnsureSuccessStatusCode();
            var houses = await response.Content.ReadFromJsonAsync<House[]>();
            Assert.NotNull(houses);
            Assert.Equal(2, houses.Length);
        }

        [Fact]
        public async Task CreateHouse_ValidRequest_ReturnsCreated()
        {
            // Arrange
            var request = new CreateHouseRequest
            {
                Name = "New Integration House",
                Address = "789 Integration St",
                Area = 200.0m
            };

            // Act
            var response = await _client.PostAsJsonAsync("/House", request);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var house = await response.Content.ReadFromJsonAsync<House>();
            Assert.NotNull(house);
            Assert.Equal("New Integration House", house.Name);
        }

        [Fact]
        public async Task UpdateHouse_ExistingHouse_ReturnsNoContent()
        {
            // Arrange
            await SeedDatabase();
            var request = new UpdateHouseRequest
            {
                Name = "Updated Integration House",
                Address = "Updated Address",
                Area = 250.0m
            };

            // Act
            var response = await _client.PutAsJsonAsync("/House/1", request);

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task DeleteHouse_ExistingHouse_ReturnsNoContent()
        {
            // Arrange
            await SeedDatabase();

            // Act
            var response = await _client.DeleteAsync("/House/1");

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task GetRoomsByHouse_ExistingHouse_ReturnsRooms()
        {
            // Arrange
            await SeedDatabase();

            // Act
            var response = await _client.GetAsync("/Room/house/1");

            // Assert
            response.EnsureSuccessStatusCode();
            var rooms = await response.Content.ReadFromJsonAsync<Room[]>();
            Assert.NotNull(rooms);
            Assert.Equal(2, rooms.Length);
            Assert.All(rooms, room => Assert.Equal(1, room.HouseId));
        }

        [Fact]
        public async Task CreateRoom_ValidRequest_ReturnsCreated()
        {
            // Arrange
            await SeedDatabase();
            var request = new CreateRoomRequest
            {
                HouseId = 1,
                Name = "New Integration Room",
                Type = "Bedroom",
                Area = 25.0m,
                Placement = "First Floor"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/Room", request);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var room = await response.Content.ReadFromJsonAsync<Room>();
            Assert.NotNull(room);
            Assert.Equal("New Integration Room", room.Name);
            Assert.Equal(1, room.HouseId);
        }

        [Fact]
        public async Task FullCrudWorkflow_House_Success()
        {
            // Create
            var createRequest = new CreateHouseRequest
            {
                Name = "Workflow Test House",
                Address = "123 Workflow St",
                Area = 180.0m
            };

            var createResponse = await _client.PostAsJsonAsync("/House", createRequest);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var createdHouse = await createResponse.Content.ReadFromJsonAsync<House>();
            Assert.NotNull(createdHouse);
            int houseId = createdHouse.HouseId;

            // Read
            var getResponse = await _client.GetAsync($"/House/{houseId}");
            getResponse.EnsureSuccessStatusCode();
            var retrievedHouse = await getResponse.Content.ReadFromJsonAsync<House>();
            Assert.NotNull(retrievedHouse);
            Assert.Equal("Workflow Test House", retrievedHouse.Name);

            // Update
            var updateRequest = new UpdateHouseRequest
            {
                Name = "Updated Workflow House",
                Address = "456 Updated St",
                Area = 220.0m
            };

            var updateResponse = await _client.PutAsJsonAsync($"/House/{houseId}", updateRequest);
            Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

            // Verify update
            var getUpdatedResponse = await _client.GetAsync($"/House/{houseId}");
            getUpdatedResponse.EnsureSuccessStatusCode();
            var updatedHouse = await getUpdatedResponse.Content.ReadFromJsonAsync<House>();
            Assert.NotNull(updatedHouse);
            Assert.Equal("Updated Workflow House", updatedHouse.Name);

            // Delete
            var deleteResponse = await _client.DeleteAsync($"/House/{houseId}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            // Verify deletion
            var getDeletedResponse = await _client.GetAsync($"/House/{houseId}");
            Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
        }

        [Fact]
        public async Task FullCrudWorkflow_Room_Success()
        {
            // First create a house
            await SeedDatabase();

            // Create room
            var createRequest = new CreateRoomRequest
            {
                HouseId = 1,
                Name = "Workflow Test Room",
                Type = "Office",
                Area = 20.0m,
                Placement = "Second Floor"
            };

            var createResponse = await _client.PostAsJsonAsync("/Room", createRequest);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var createdRoom = await createResponse.Content.ReadFromJsonAsync<Room>();
            Assert.NotNull(createdRoom);
            int roomId = createdRoom.RoomId;

            // Read
            var getResponse = await _client.GetAsync($"/Room/{roomId}");
            getResponse.EnsureSuccessStatusCode();
            var retrievedRoom = await getResponse.Content.ReadFromJsonAsync<Room>();
            Assert.NotNull(retrievedRoom);
            Assert.Equal("Workflow Test Room", retrievedRoom.Name);

            // Update
            var updateRequest = new UpdateRoomRequest
            {
                HouseId = 1,
                Name = "Updated Workflow Room",
                Type = "Study",
                Area = 25.0m,
                Placement = "Second Floor"
            };

            var updateResponse = await _client.PutAsJsonAsync($"/Room/{roomId}", updateRequest);
            Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

            // Verify update
            var getUpdatedResponse = await _client.GetAsync($"/Room/{roomId}");
            getUpdatedResponse.EnsureSuccessStatusCode();
            var updatedRoom = await getUpdatedResponse.Content.ReadFromJsonAsync<Room>();
            Assert.NotNull(updatedRoom);
            Assert.Equal("Updated Workflow Room", updatedRoom.Name);
            Assert.Equal("Study", updatedRoom.Type);

            // Delete
            var deleteResponse = await _client.DeleteAsync($"/Room/{roomId}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            // Verify deletion
            var getDeletedResponse = await _client.GetAsync($"/Room/{roomId}");
            Assert.Equal(HttpStatusCode.NotFound, getDeletedResponse.StatusCode);
        }
    }
}