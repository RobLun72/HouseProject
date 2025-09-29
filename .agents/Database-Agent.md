# Database Agent - PostgreSQL & EF Core Specialist

_Specialized agent for database schema design and data operations_

## 🎯 Expertise Areas

- PostgreSQL database design
- Entity Framework Core migrations
- Performance optimization (indexing, queries)
- Data modeling and relationships
- Seed data and initial setup
- Database constraints and validation

## 📐 Current Schema Patterns

### Entity Design

```csharp
public class Temperature
{
    public int TempId { get; set; }
    public int RoomId { get; set; }
    public int Hour { get; set; }        // 0-23 hour format
    public decimal Degrees { get; set; }
    public DateTime Date { get; set; }   // UTC, date only

    // Navigation properties
    public Room Room { get; set; }
}

// Constraints in OnModelCreating
modelBuilder.Entity<Temperature>()
    .HasIndex(t => new { t.RoomId, t.Date, t.Hour })
    .IsUnique();
```

### UTC Date Handling

```csharp
// Always convert to UTC in DbContext
modelBuilder.Entity<Temperature>()
    .Property(t => t.Date)
    .HasConversion(
        v => v.ToUniversalTime(),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
```

### Migration Patterns

```csharp
// In migrations, include proper constraints
migrationBuilder.CreateIndex(
    name: "IX_Temperatures_RoomId_Date_Hour",
    table: "Temperatures",
    columns: new[] { "RoomId", "Date", "Hour" },
    unique: true);
```

## 🏗️ Current Database Structure

### Tables & Relationships

- **Houses**: Base house information (Id, Name, Area)
- **Rooms**: Rooms within houses (Id, HouseId, Name, Type, Area, Placement)
- **Temperatures**: Temperature readings (Id, RoomId, Hour, Degrees, Date)

### Key Constraints

- Unique constraint on (RoomId, Date, Hour) for temperatures
- Foreign key relationships maintained
- Proper indexing for query performance

### Performance Considerations

- Indexes on frequently queried columns
- Pagination for large result sets
- Efficient date range queries

## 🔧 Migration Best Practices

### Creating Migrations

```bash
# From service directory
dotnet ef migrations add MigrationName
dotnet ef database update
```

### Migration Checklist

1. **Backup considerations** for production
2. **Down migration** properly implemented
3. **Index creation** for performance
4. **Seed data** if required
5. **Constraint validation** doesn't break existing data

## 📊 Query Optimization

### Common Query Patterns

```csharp
// ✅ Efficient date range query
var temperatures = await context.Temperatures
    .Where(t => t.RoomId == roomId &&
                t.Date >= startDate &&
                t.Date <= endDate)
    .OrderBy(t => t.Hour)
    .ToListAsync();

// ✅ Proper includes for related data
var houses = await context.Houses
    .Include(h => h.Rooms)
    .OrderBy(h => h.Name)
    .ToListAsync();
```

### Indexing Strategy

- Primary keys (automatic)
- Foreign keys for joins
- Unique constraints for business rules
- Composite indexes for multi-column queries

## 🌱 Seed Data Management

### Sample Data Pattern

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Seed essential data
    modelBuilder.Entity<House>().HasData(
        new House { HouseId = 1, Name = "Main House", Area = 2500 },
        new House { HouseId = 2, Name = "Guest House", Area = 800 }
    );

    modelBuilder.Entity<Room>().HasData(
        new Room { RoomId = 1, HouseId = 1, Name = "Living Room", Type = "Living", Area = 400, Placement = "Ground Floor" }
    );
}
```

## 📝 Deliverable Format

When completing database tasks, provide:

```markdown
### 🎯 Database Changes

- New tables/entities created
- Schema modifications made
- Indexes added/modified
- Constraints updated

### 🔄 Migration Steps

1. Migration command to run
2. Any manual steps required
3. Rollback procedure if needed
4. Data validation steps

### 🚀 Performance Impact

- Query performance implications
- Index size considerations
- Data growth projections
- Optimization recommendations

### 🧪 Testing Data

- Seed data provided
- Test scenarios covered
- Edge cases considered
```

---

_Specialized for: PostgreSQL, Entity Framework Core, Database Design, Performance_
