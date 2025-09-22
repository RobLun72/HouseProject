using MassTransit;
using MessageContracts;

namespace HouseService.Services
{
    public interface IMessagePublisher
    {
        Task PublishHouseCreatedAsync(int houseId, string name, string address, decimal area);
        Task PublishHouseUpdatedAsync(int houseId, string name, string address, decimal area);
        Task PublishHouseDeletedAsync(int houseId);
        Task PublishRoomCreatedAsync(int roomId, int houseId, string name, string type, decimal area);
        Task PublishRoomUpdatedAsync(int roomId, int houseId, string name, string type, decimal area);
        Task PublishRoomDeletedAsync(int roomId, int houseId);
    }

    public class MessagePublisher : IMessagePublisher
    {
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly ILogger<MessagePublisher> _logger;

        public MessagePublisher(IPublishEndpoint publishEndpoint, ILogger<MessagePublisher> logger)
        {
            _publishEndpoint = publishEndpoint;
            _logger = logger;
        }

        public async Task PublishHouseCreatedAsync(int houseId, string name, string address, decimal area)
        {
            try
            {
                var message = new HouseCreated
                {
                    HouseId = houseId,
                    Name = name,
                    Address = address,
                    Area = area,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IHouseCreated>(message);
                _logger.LogInformation("Published HouseCreated event for House ID: {HouseId}", houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish HouseCreated event for House ID: {HouseId}", houseId);
                throw;
            }
        }

        public async Task PublishHouseUpdatedAsync(int houseId, string name, string address, decimal area)
        {
            try
            {
                var message = new HouseUpdated
                {
                    HouseId = houseId,
                    Name = name,
                    Address = address,
                    Area = area,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IHouseUpdated>(message);
                _logger.LogInformation("Published HouseUpdated event for House ID: {HouseId}", houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish HouseUpdated event for House ID: {HouseId}", houseId);
                throw;
            }
        }

        public async Task PublishHouseDeletedAsync(int houseId)
        {
            try
            {
                var message = new HouseDeleted
                {
                    HouseId = houseId,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IHouseDeleted>(message);
                _logger.LogInformation("Published HouseDeleted event for House ID: {HouseId}", houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish HouseDeleted event for House ID: {HouseId}", houseId);
                throw;
            }
        }

        public async Task PublishRoomCreatedAsync(int roomId, int houseId, string name, string type, decimal area)
        {
            try
            {
                var message = new RoomCreated
                {
                    RoomId = roomId,
                    HouseId = houseId,
                    Name = name,
                    Type = type,
                    Area = area,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IRoomCreated>(message);
                _logger.LogInformation("Published RoomCreated event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish RoomCreated event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
                throw;
            }
        }

        public async Task PublishRoomUpdatedAsync(int roomId, int houseId, string name, string type, decimal area)
        {
            try
            {
                var message = new RoomUpdated
                {
                    RoomId = roomId,
                    HouseId = houseId,
                    Name = name,
                    Type = type,
                    Area = area,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IRoomUpdated>(message);
                _logger.LogInformation("Published RoomUpdated event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish RoomUpdated event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
                throw;
            }
        }

        public async Task PublishRoomDeletedAsync(int roomId, int houseId)
        {
            try
            {
                var message = new RoomDeleted
                {
                    RoomId = roomId,
                    HouseId = houseId,
                    EventTime = DateTime.UtcNow
                };

                await _publishEndpoint.Publish<IRoomDeleted>(message);
                _logger.LogInformation("Published RoomDeleted event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to publish RoomDeleted event for Room ID: {RoomId}, House ID: {HouseId}", roomId, houseId);
                throw;
            }
        }
    }
}