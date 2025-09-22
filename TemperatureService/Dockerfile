FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy shared contracts project
COPY ["MessageContracts/MessageContracts.csproj", "MessageContracts/"]

# Copy service project
COPY ["TemperatureService/TemperatureService.csproj", "TemperatureService/"]

# Restore dependencies
RUN dotnet restore "TemperatureService/TemperatureService.csproj"

# Copy all source code
COPY MessageContracts/ MessageContracts/
COPY TemperatureService/ TemperatureService/

# Build the projects
WORKDIR "/src/TemperatureService"
RUN dotnet build "TemperatureService.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "TemperatureService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TemperatureService.dll"]