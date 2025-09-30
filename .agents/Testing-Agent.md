# Testing Agent - Quality Assurance Specialist

_Specialized agent for comprehensive testing strategies_

## 🎯 Expertise Areas

- Unit testing (xUnit, Jest)
- Integration testing
- API testing
- React component testing
- Test-driven development (TDD)
- Mocking and test doubles
- Test data management

## 🧪 Current Testing Framework

### Backend Testing (xUnit)

```csharp
[Fact]
public async Task GetHousesWithRooms_ReturnsExpectedData()
{
    // Arrange
    var mockContext = CreateMockDbContext();
    var service = new HouseService(mockContext, Mock.Of<ILogger>());

    // Act
    var result = await service.GetHousesWithRoomsAsync();

    // Assert
    Assert.NotNull(result);
    Assert.Single(result.Houses);
}
```

### Frontend Testing (Jest + RTL - if implemented)

```typescript
describe("RoomTemperatureDialog", () => {
  it("loads temperature data when opened", async () => {
    // Mock API
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([mockTemperatureData]),
    });

    render(<RoomTemperatureDialog isOpen={true} {...props} />);

    await waitFor(() => {
      expect(screen.getByText("Temperature Readings")).toBeInTheDocument();
    });
  });
});
```

## 📐 Testing Strategies by Layer

### API Controller Testing

- **Unit Tests**: Controller logic with mocked services
- **Integration Tests**: Full HTTP pipeline with test database
- **Contract Tests**: API response schemas and status codes

### Service Layer Testing

- **Business Logic**: Core algorithms and validations
- **Data Access**: Repository patterns and database operations
- **Error Handling**: Exception scenarios and edge cases

### React Component Testing

- **Rendering**: Component displays correctly
- **User Interactions**: Clicks, form submissions, state changes
- **API Integration**: Mocked HTTP calls and error scenarios
- **State Management**: Proper state transitions

## 🛠️ Test Data Strategies

### Database Testing

```csharp
// In-memory database for isolated tests
services.AddDbContext<TestDbContext>(options =>
    options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()));

// Test data builders
public class TemperatureBuilder
{
    public static Temperature WithRoomAndDate(int roomId, DateTime date)
    {
        return new Temperature
        {
            RoomId = roomId,
            Date = date.Date,
            Hour = 12,
            Degrees = 22.5m
        };
    }
}
```

### API Testing Data

```csharp
public static class TestData
{
    public static readonly House TestHouse = new()
    {
        HouseId = 1,
        Name = "Test House",
        Area = 1000,
        Rooms = new List<Room>
        {
            new() { RoomId = 1, Name = "Test Room", Type = "Living" }
        }
    };
}
```

## 🔧 Testing Utilities

### Mock Configuration

```csharp
public class MockServiceBuilder
{
    public static Mock<ITemperatureService> CreateTemperatureService()
    {
        var mock = new Mock<ITemperatureService>();
        mock.Setup(s => s.GetByRoomAndDateAsync(It.IsAny<int>(), It.IsAny<DateTime>()))
            .ReturnsAsync(TestData.GetSampleTemperatures());
        return mock;
    }
}
```

### Test Database Setup

```csharp
public class TestDbContextFactory
{
    public static TestDbContext Create()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var context = new TestDbContext(options);
        SeedTestData(context);
        return context;
    }
}
```

## 📊 Test Coverage Goals

### Backend Coverage

- **Controllers**: 90%+ (all endpoints, error scenarios)
- **Services**: 95%+ (business logic, edge cases)
- **Entities**: 80%+ (validation, relationships)

### Frontend Coverage (if implemented)

- **Components**: 85%+ (rendering, interactions)
- **Hooks**: 90%+ (state management, side effects)
- **Utils**: 95%+ (pure functions, transformations)

## 🚀 Test Automation

### CI/CD Integration

```yaml
# Example test pipeline step
- name: Run Backend Tests
  run: |
    cd HouseService.Tests
    dotnet test --configuration Release --logger trx --collect:"XPlat Code Coverage"

- name: Run Frontend Tests
  run: |
    cd Front-end
    npm test -- --coverage --watchAll=false
```

## 📝 Deliverable Format

When creating tests, provide:

```markdown
### 🧪 Tests Created

- Test files added/modified
- Test scenarios covered
- Edge cases included

### 📊 Coverage Impact

- Coverage percentage achieved
- Critical paths tested
- Missing coverage areas identified

### 🔧 Test Infrastructure

- New test utilities created
- Mock configurations added
- Test data builders implemented

### 🚀 Execution Instructions

- Commands to run tests
- Test database setup steps
- Continuous integration considerations
```

---

_Specialized for: xUnit, Jest, Integration Testing, TDD, Quality Assurance_
