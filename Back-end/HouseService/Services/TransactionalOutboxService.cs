using HouseService.Data;
using Microsoft.EntityFrameworkCore;

namespace HouseService.Services
{
    /// <summary>
    /// Transactional outbox service that handles both real database transactions and InMemory database limitations
    /// </summary>
    public class TransactionalOutboxService : ITransactionalOutboxService
    {
        private readonly IOutboxService _outboxService;

        public TransactionalOutboxService(IOutboxService outboxService)
        {
            _outboxService = outboxService;
        }

        public async Task ExecuteInTransactionAsync(Func<HouseDbContext, IOutboxService, Task> operation, HouseDbContext context)
        {
            if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
            {
                // InMemory database doesn't support transactions - execute operation directly
                await operation(context, _outboxService);
                return;
            }

            // Real database - use proper transaction
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                await operation(context, _outboxService);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<T> ExecuteInTransactionAsync<T>(Func<HouseDbContext, IOutboxService, Task<T>> operation, HouseDbContext context)
        {
            if (context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
            {
                // InMemory database doesn't support transactions - execute operation directly
                return await operation(context, _outboxService);
            }

            // Real database - use proper transaction
            using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                var result = await operation(context, _outboxService);
                await transaction.CommitAsync();
                return result;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}