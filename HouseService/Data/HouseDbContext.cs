using Microsoft.EntityFrameworkCore;
using HouseService.Models;
using HouseService.Entities;

namespace HouseService.Data
{
    public class HouseDbContext : DbContext
    {
        public HouseDbContext(DbContextOptions<HouseDbContext> options) : base(options)
        {
        }

        public DbSet<House> Houses { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<OutboxEvent> OutboxEvents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure House entity
            modelBuilder.Entity<House>(entity =>
            {
                entity.HasKey(e => e.HouseId);
                entity.Property(e => e.HouseId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Area).IsRequired().HasPrecision(10, 2);

                // Configure one-to-many relationship with Rooms
                entity.HasMany<Room>()
                      .WithOne()
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
            });

            // Configure OutboxEvent entity
            modelBuilder.Entity<OutboxEvent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(200);
                entity.Property(e => e.EventData).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.IsPublished).IsRequired();
                entity.Property(e => e.RetryCount).IsRequired();
                entity.Property(e => e.LastError).HasMaxLength(1000);

                // Index for efficient querying of unpublished events
                entity.HasIndex(e => new { e.IsPublished, e.CreatedAt });
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Houses
            modelBuilder.Entity<House>().HasData(
                new House { HouseId = 1, Name = "Modern Villa", Address = "123 Elm Street", Area = 250.5m },
                new House { HouseId = 2, Name = "Cozy Apartment", Address = "456 Oak Avenue", Area = 85.0m },
                new House { HouseId = 3, Name = "Family Home", Address = "789 Pine Road", Area = 180.7m }
            );

            // Seed Rooms
            modelBuilder.Entity<Room>().HasData(
                new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 25.5m, Placement = "Ground Floor" },
                new Room { RoomId = 2, HouseId = 1, Name = "Master Bedroom", Type = "Bedroom", Area = 30.0m, Placement = "First Floor" },
                new Room { RoomId = 3, HouseId = 2, Name = "Kitchen", Type = "Kitchen", Area = 15.5m, Placement = "Main Level" },
                new Room { RoomId = 4, HouseId = 3, Name = "Office", Type = "Office", Area = 20.7m, Placement = "Second Floor" }
            );
        }
    }
}