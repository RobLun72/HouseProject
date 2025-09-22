using Microsoft.EntityFrameworkCore;
using TemperatureService.Models;

namespace TemperatureService.Data
{
    public class TemperatureDbContext : DbContext
    {
        public TemperatureDbContext(DbContextOptions<TemperatureDbContext> options) : base(options)
        {
        }

        public DbSet<Temperature> Temperatures { get; set; }
        public DbSet<House> Houses { get; set; }
        public DbSet<Room> Rooms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Temperature entity
            modelBuilder.Entity<Temperature>(entity =>
            {
                entity.HasKey(e => e.TempId);
                entity.Property(e => e.TempId).ValueGeneratedOnAdd();
                entity.Property(e => e.RoomId).IsRequired();
                entity.Property(e => e.Hour).IsRequired();
                entity.Property(e => e.Degrees).IsRequired().HasPrecision(5, 2);
                entity.Property(e => e.Date).IsRequired();

                // Create a unique constraint on RoomId, Hour, and Date
                entity.HasIndex(e => new { e.RoomId, e.Hour, e.Date }).IsUnique();
            });

            // Configure House entity
            modelBuilder.Entity<House>(entity =>
            {
                entity.HasKey(e => e.HouseId);
                entity.Property(e => e.HouseId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Area).IsRequired().HasPrecision(10, 2);

                // Configure one-to-many relationship with Rooms
                entity.HasMany(h => h.Rooms)
                      .WithOne(r => r.House)
                      .HasForeignKey(r => r.HouseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Room entity
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasKey(e => e.RoomId);
                entity.Property(e => e.RoomId).ValueGeneratedOnAdd();
                entity.Property(e => e.HouseId).IsRequired();
                entity.Property(e => e.Area).IsRequired().HasPrecision(10, 2);
                entity.Property(e => e.Placement).IsRequired().HasMaxLength(200);

                // Configure relationship with Temperature
                entity.HasMany(r => r.Temperatures)
                      .WithOne()
                      .HasForeignKey(t => t.RoomId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Houses
            modelBuilder.Entity<House>().HasData(
                new House { HouseId = 1, Name = "Family Home", Area = 150.5 },
                new House { HouseId = 2, Name = "Vacation House", Area = 85.2 }
            );

            // Seed Rooms
            modelBuilder.Entity<Room>().HasData(
                new Room { RoomId = 1, HouseId = 1, Area = 25.0, Placement = "Living Room" },
                new Room { RoomId = 2, HouseId = 1, Area = 15.5, Placement = "Bedroom" },
                new Room { RoomId = 3, HouseId = 1, Area = 12.0, Placement = "Kitchen" },
                new Room { RoomId = 4, HouseId = 2, Area = 20.0, Placement = "Living Room" },
                new Room { RoomId = 5, HouseId = 2, Area = 18.0, Placement = "Bedroom" }
            );

            // Seed Temperature data
            var baseDate = new DateTime(2025, 9, 22);
            modelBuilder.Entity<Temperature>().HasData(
                new Temperature { TempId = 1, RoomId = 1, Hour = 8, Degrees = 22.5, Date = baseDate },
                new Temperature { TempId = 2, RoomId = 1, Hour = 12, Degrees = 24.0, Date = baseDate },
                new Temperature { TempId = 3, RoomId = 1, Hour = 18, Degrees = 23.2, Date = baseDate },
                new Temperature { TempId = 4, RoomId = 2, Hour = 8, Degrees = 20.8, Date = baseDate },
                new Temperature { TempId = 5, RoomId = 2, Hour = 12, Degrees = 25.5, Date = baseDate },
                new Temperature { TempId = 6, RoomId = 3, Hour = 14, Degrees = 19.7, Date = baseDate }
            );
        }
    }
}