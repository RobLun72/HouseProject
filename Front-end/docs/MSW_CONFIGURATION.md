# MSW Development Configuration

This project now supports MSW (Mock Service Worker) for development mode with configurable behavior through environment variables.

## Environment Variables

Add these variables to your `.env.local` file to control MSW behavior in development:

```bash
# Enable/disable MSW mocking in development
VITE_ENABLE_MSW_MOCKING=true

# Add artificial delay to API responses (in milliseconds)
VITE_MSW_API_DELAY=500

# Enable/disable MSW warnings for unhandled requests
VITE_MSW_WARN=false
```

## Configuration Options

### `VITE_ENABLE_MSW_MOCKING`

- **Default**: `false`
- **Description**: Enables MSW mocking in development mode
- **Values**: `true` or `false`

### `VITE_MSW_API_DELAY`

- **Default**: `0`
- **Description**: Artificial delay added to all API responses (useful for testing loading states)
- **Values**: Number in milliseconds (e.g., `500` for 500ms delay)

### `VITE_MSW_WARN`

- **Default**: `false`
- **Description**: Controls whether MSW shows warnings for unhandled requests
- **Values**: `true` or `false`

## Usage

When `VITE_ENABLE_MSW_MOCKING=true`, the application will:

1. Start MSW in development mode
2. Initialize the in-memory database with base data and temperature readings using `setupBaseDataWithTemperatures()`
3. Intercept API calls to the configured endpoints
4. Return data from the MSW in-memory database (houses, rooms, temperatures)
5. Apply configured delays to simulate network latency
6. Show/hide warnings based on the warn setting

The database includes:

- Houses and rooms from JSON data files
- Temperature readings for the last 3 days (8 AM, 12 PM, 6 PM, 10 PM daily)
- Realistic temperature variations
- Full CRUD operations support

## Benefits

- **Development without backend**: Work on frontend features without needing the actual backend services
- **Consistent test data**: Reliable, reproducible data for development
- **Network simulation**: Test loading states and slow network conditions
- **Offline development**: Continue working even when backend services are unavailable

## Example Development Scenarios

1. **Fast development** (no delays):

   ```bash
   VITE_ENABLE_MSW_MOCKING=true
   VITE_MSW_API_DELAY=0
   VITE_MSW_WARN=false
   ```

2. **Realistic network testing** (with delays):

   ```bash
   VITE_ENABLE_MSW_MOCKING=true
   VITE_MSW_API_DELAY=1500
   VITE_MSW_WARN=false
   ```

3. **Debug mode** (with warnings):
   ```bash
   VITE_ENABLE_MSW_MOCKING=true
   VITE_MSW_API_DELAY=500
   VITE_MSW_WARN=true
   ```

## Available Data

When MSW is enabled, the following data is available:

### Houses

Data loaded from `src/test/mocks/database/datafiles/houses.json`

### Rooms

Data loaded from `src/test/mocks/database/datafiles/rooms.json`

### Temperature Data

- Automatically generated for all rooms
- Covers the last 3 days
- 4 readings per day (8 AM, 12 PM, 6 PM, 10 PM)
- Realistic temperature variations (18-26°C range)

### API Endpoints Available

- `GET /House` - Get all houses
- `GET /House/:houseId` - Get specific house
- `GET /Room/house/:houseId` - Get rooms for a house
- `GET /Room/:roomId` - Get specific room
- `POST /Room` - Create new room
- `PUT /Room/:roomId` - Update room
- `DELETE /Room/:roomId` - Delete room
- `GET /HousesWithRooms` - Get houses with their rooms
- `GET /Temperature/room/:roomId/dates` - Get available dates for room
- `GET /Temperature/room/:roomId/date/:date` - Get temperature data for specific date

## Note

MSW mocking is only available in development mode (`npm run dev`). Production builds will not include MSW and will use the actual backend APIs configured in the environment variables.
