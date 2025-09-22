using Microsoft.EntityFrameworkCore;

namespace HouseService.Data
{
    public class HouseDbContext : DbContext
    {
        public HouseDbContext(DbContextOptions<HouseDbContext> options) : base(options)
        {
        }

        public DbSet<House> Houses { get; set; }
        public DbSet<Room> Rooms { get; set; }

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

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Houses
            modelBuilder.Entity<House>().HasData(
                new House { HouseId = 1, Name = "Modern Villa", Area = 250.5 },
                new House { HouseId = 2, Name = "Cozy Apartment", Area = 85.0 },
                new House { HouseId = 3, Name = "Family Home", Area = 180.7 }
            );

            // Seed Rooms
            modelBuilder.Entity<Room>().HasData(
                new Room { RoomId = 1, HouseId = 1, Area = 25.5, Placement = "Ground Floor" },
                new Room { RoomId = 2, HouseId = 1, Area = 30.0, Placement = "First Floor" },
                new Room { RoomId = 3, HouseId = 2, Area = 15.5, Placement = "Main Level" },
                new Room { RoomId = 4, HouseId = 3, Area = 20.7, Placement = "Second Floor" }
            );
        }
    }
}