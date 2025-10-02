using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Moq;
using TemperatureService.Data;
using TemperatureService.Models;
using TemperatureService.Services;
using MassTransit;

namespace TemperatureService.Tests;

public class TestBase : IDisposable
{
    protected readonly TemperatureDbContext Context;
    protected readonly Mock<ISyncService> MockSyncService;
    protected readonly Mock<IHouseDataService> MockHouseDataService;
    protected readonly Mock<IPublishEndpoint> MockPublishEndpoint;

    public TestBase()
    {
        var options = new DbContextOptionsBuilder<TemperatureDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;

        Context = new TemperatureDbContext(options);
        
        // Create mocks
        MockSyncService = new Mock<ISyncService>();
        MockHouseDataService = new Mock<IHouseDataService>();
        MockPublishEndpoint = new Mock<IPublishEndpoint>();
        
        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Seed Houses
        var houses = new List<House>
        {
            new House { HouseId = 1, Name = "Test House 1", Address = "123 Test St", Area = 150.0m },
            new House { HouseId = 2, Name = "Test House 2", Address = "456 Test Ave", Area = 200.0m }
        };
        Context.Houses.AddRange(houses);

        // Seed Rooms
        var rooms = new List<Room>
        {
            new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 25.0m, Placement = "Front" },
            new Room { RoomId = 2, HouseId = 1, Name = "Bedroom", Type = "Bedroom", Area = 15.0m, Placement = "Back" },
            new Room { RoomId = 3, HouseId = 2, Name = "Kitchen", Type = "Kitchen", Area = 12.0m, Placement = "Side" }
        };
        Context.Rooms.AddRange(rooms);

        // Seed Temperatures
        var baseDate = DateTime.UtcNow.Date;
        var temperatures = new List<Temperature>
        {
            new Temperature { TempId = 1, RoomId = 1, Hour = 8, Degrees = 22.5, Date = baseDate },
            new Temperature { TempId = 2, RoomId = 1, Hour = 12, Degrees = 24.0, Date = baseDate },
            new Temperature { TempId = 3, RoomId = 1, Hour = 18, Degrees = 23.2, Date = baseDate },
            new Temperature { TempId = 4, RoomId = 2, Hour = 8, Degrees = 20.8, Date = baseDate },
            new Temperature { TempId = 5, RoomId = 2, Hour = 12, Degrees = 25.5, Date = baseDate },
            new Temperature { TempId = 6, RoomId = 3, Hour = 14, Degrees = 19.7, Date = baseDate }
        };
        Context.Temperatures.AddRange(temperatures);

        Context.SaveChanges();
    }

    public void Dispose()
    {
        Context?.Dispose();
    }

    public class TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real database context
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<TemperatureDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database
                services.AddDbContext<TemperatureDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase");
                });

                // Replace services with mocks
                services.RemoveAll(typeof(ISyncService));
                services.RemoveAll(typeof(IHouseDataService));
                services.RemoveAll(typeof(IPublishEndpoint));
                services.RemoveAll(typeof(IBus));
                services.RemoveAll(typeof(ISendEndpointProvider));
                services.RemoveAll(typeof(IRequestClient<>));

                services.AddSingleton<ISyncService>(provider =>
                {
                    var mock = new Mock<ISyncService>();
                    return mock.Object;
                });

                services.AddSingleton<IHouseDataService>(provider =>
                {
                    var mock = new Mock<IHouseDataService>();
                    return mock.Object;
                });

                services.AddSingleton<IPublishEndpoint>(provider =>
                {
                    var mock = new Mock<IPublishEndpoint>();
                    return mock.Object;
                });

                // Build the service provider and ensure database is created
                var serviceProvider = services.BuildServiceProvider();
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<TemperatureDbContext>();
                context.Database.EnsureCreated();
                
                // Seed test data for integration tests
                SeedIntegrationTestData(context);
            });

            builder.UseEnvironment("Testing");
        }

        private void SeedIntegrationTestData(TemperatureDbContext context)
        {
            if (context.Houses.Any()) return; // Already seeded

            // Seed Houses
            var houses = new List<House>
            {
                new House { HouseId = 1, Name = "Integration Test House", Address = "123 Integration St", Area = 150.0m },
                new House { HouseId = 2, Name = "Integration Test House 2", Address = "456 Integration Ave", Area = 200.0m }
            };
            context.Houses.AddRange(houses);

            // Seed Rooms
            var rooms = new List<Room>
            {
                new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 25.0m, Placement = "Front" },
                new Room { RoomId = 2, HouseId = 1, Name = "Bedroom", Type = "Bedroom", Area = 15.0m, Placement = "Back" },
                new Room { RoomId = 3, HouseId = 2, Name = "Kitchen", Type = "Kitchen", Area = 12.0m, Placement = "Side" }
            };
            context.Rooms.AddRange(rooms);

            // Seed Temperatures
            var baseDate = DateTime.UtcNow.Date;
            var temperatures = new List<Temperature>
            {
                new Temperature { TempId = 1, RoomId = 1, Hour = 8, Degrees = 22.5, Date = baseDate },
                new Temperature { TempId = 2, RoomId = 1, Hour = 12, Degrees = 24.0, Date = baseDate },
                new Temperature { TempId = 3, RoomId = 1, Hour = 18, Degrees = 23.2, Date = baseDate },
                new Temperature { TempId = 4, RoomId = 2, Hour = 8, Degrees = 20.8, Date = baseDate },
                new Temperature { TempId = 5, RoomId = 2, Hour = 12, Degrees = 25.5, Date = baseDate },
                new Temperature { TempId = 6, RoomId = 3, Hour = 14, Degrees = 19.7, Date = baseDate }
            };
            context.Temperatures.AddRange(temperatures);

            context.SaveChanges();
        }
    }
}