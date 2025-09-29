using HouseService.Data;

namespace HouseService.Services
{
    /// <summary>
    /// Service that provides transactional operations with automatic outbox event creation
    /// </summary>
    public interface ITransactionalOutboxService
    {
        /// <summary>
        /// Executes a business operation within a transaction and creates outbox events atomically
        /// </summary>
        /// <param name="operation">The business operation to execute</param>
        /// <param name="context">The database context to use</param>
        Task ExecuteInTransactionAsync(Func<HouseDbContext, IOutboxService, Task> operation, HouseDbContext context);
        
        /// <summary>
        /// Executes a business operation within a transaction and creates outbox events atomically, returning a result
        /// </summary>
        /// <typeparam name="T">The type of result to return</typeparam>
        /// <param name="operation">The business operation to execute</param>
        /// <param name="context">The database context to use</param>
        Task<T> ExecuteInTransactionAsync<T>(Func<HouseDbContext, IOutboxService, Task<T>> operation, HouseDbContext context);
    }
}