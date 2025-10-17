using TemperatureService.Services;
using TemperatureService.Data;
using TemperatureService.Consumers;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using MessageContracts;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add Docker-specific configuration if running in container
if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER")))
{
    builder.Configuration.AddJsonFile("appsettings.Docker.json", optional: true, reloadOnChange: true);
}

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Temperature Service API", 
        Version = "v1",
        Description = "API for managing temperature data and synchronized house/room information"
    });
    
    // Add API Key authentication
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key needed to access the endpoints. X-Api-Key: {your_api_key}",
        In = ParameterLocation.Header,
        Name = "X-Api-Key",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKeyScheme"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                },
                Scheme = "ApiKeyScheme",
                Name = "X-Api-Key",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Configure Entity Framework with PostgreSQL
builder.Services.AddDbContext<TemperatureDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register custom services
builder.Services.AddScoped<IHouseDataService, HouseDataService>();
builder.Services.AddScoped<ISyncService, SyncService>();
builder.Services.AddScoped<ITemperatureDataSeeder, TemperatureDataSeeder>();
builder.Services.AddHttpClient();

// Configure MassTransit with RabbitMQ and consumers
builder.Services.AddMassTransit(x =>
{
    // Add consumers
    x.AddConsumer<HouseCreatedConsumer>();
    x.AddConsumer<HouseUpdatedConsumer>();
    x.AddConsumer<HouseDeletedConsumer>();
    x.AddConsumer<RoomCreatedConsumer>();
    x.AddConsumer<RoomUpdatedConsumer>();
    x.AddConsumer<RoomDeletedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitMqHost = builder.Configuration["RabbitMQ:Host"] ?? "localhost";
        var rabbitMqUsername = builder.Configuration["RabbitMQ:Username"] ?? "admin";
        var rabbitMqPassword = builder.Configuration["RabbitMQ:Password"] ?? "admin123";

        cfg.Host(rabbitMqHost, h =>
        {
            h.Username(rabbitMqUsername);
            h.Password(rabbitMqPassword);
        });

        // Configure consumer-level defaults: retries, circuit breaker, etc.
        cfg.UseMessageRetry(r => r.Exponential(5, TimeSpan.FromSeconds(1), TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(3)));
        cfg.UseKillSwitch(); // Prevent runaway failure loops under sustained faults

        // In-memory outbox ensures idempotent publish within consumer pipeline
        cfg.UseInMemoryOutbox();

        // Configure endpoints with kebab-case names
        cfg.ConfigureEndpoints(context, new KebabCaseEndpointNameFormatter(false));
    });
});

// Configure CORS to allow frontend access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000", "https://localhost:3000", // Docker containerized frontend
                "http://localhost:5173", "https://localhost:5173", // Vite dev server default port
                "http://localhost:5174", "https://localhost:5174"  // Vite dev server alternate port
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Allow credentials for secure communication
    });
});

var app = builder.Build();

// Ensure database is created and migrated
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<TemperatureDbContext>();
    var seeder = scope.ServiceProvider.GetRequiredService<ITemperatureDataSeeder>();
    try
    {
        // Apply pending migrations
        await context.Database.MigrateAsync();
        app.Logger.LogInformation("Database migrations applied successfully");
        
        // Update existing records with meaningful dates
        await seeder.UpdateExistingRecordsWithDatesAsync();
        
        // Seed temperature data for the last 30 days
        await seeder.SeedTemperatureDataAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while ensuring the database was created or seeding data");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS policy BEFORE other middleware
app.UseCors("AllowFrontend");

// Use HTTPS redirection (now that we have certificates even in Docker)
app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();

// Make Program accessible for testing
public partial class Program { }