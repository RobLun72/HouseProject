using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using HouseService.Data;
using HouseService.Services;
using Moq;

namespace HouseService.Tests
{
    public class TestBase : IDisposable
    {
        protected readonly DbContextOptions<HouseDbContext> DbContextOptions;
        protected readonly Mock<IMessagePublisher> MockMessagePublisher;
        protected readonly Mock<ILogger<object>> MockLogger;

        public TestBase()
        {
            // Create in-memory database with unique name for each test
            DbContextOptions = new DbContextOptionsBuilder<HouseDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // Setup mocks
            MockMessagePublisher = new Mock<IMessagePublisher>();
            MockLogger = new Mock<ILogger<object>>();
        }

        protected HouseDbContext CreateDbContext()
        {
            return new HouseDbContext(DbContextOptions);
        }

        protected void SeedDatabase(HouseDbContext context)
        {
            var houses = new[]
            {
                new HouseService.Models.House { HouseId = 1, Name = "Test House 1", Address = "123 Test St", Area = 100.0m },
                new HouseService.Models.House { HouseId = 2, Name = "Test House 2", Address = "456 Test Ave", Area = 150.0m }
            };

            var rooms = new[]
            {
                new HouseService.Models.Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 50.0m, Placement = "Ground Floor" },
                new HouseService.Models.Room { RoomId = 2, HouseId = 1, Name = "Kitchen", Type = "Kitchen", Area = 30.0m, Placement = "Ground Floor" },
                new HouseService.Models.Room { RoomId = 3, HouseId = 2, Name = "Bedroom", Type = "Bedroom", Area = 40.0m, Placement = "First Floor" }
            };

            context.Houses.AddRange(houses);
            context.Rooms.AddRange(rooms);
            context.SaveChanges();
        }

        public void Dispose()
        {
            using var context = CreateDbContext();
            context.Database.EnsureDeleted();
        }
    }

    public class TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real database context
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<HouseDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database
                services.AddDbContext<HouseDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase");
                });

                // Replace message publisher with mock
                var publisherDescriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(IMessagePublisher));
                if (publisherDescriptor != null)
                    services.Remove(publisherDescriptor);

                services.AddSingleton<IMessagePublisher>(provider =>
                {
                    var mock = new Mock<IMessagePublisher>();
                    return mock.Object;
                });
            });
        }
    }
}