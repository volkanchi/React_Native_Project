using ServisTakipApi.Models;

namespace ServisTakipApi.Repositories
{
    public interface IVehicleRepository
    {
        Task<Vehicle> AddAsync(Vehicle vehicle);
        Task<Vehicle?> DeleteAsync(Guid vehicleId, Guid companyId);
        Task<Vehicle?> GetByIdAsync(Guid vehicleId, Guid companyId);
        Task<bool> PlateExistsAsync(string plateNumber, Guid companyId);
        Task<IEnumerable<Vehicle>> GetVehiclesByCompanyIdAsync(Guid companyId);
        Task<bool> AssignDriverAsync(Guid driverId, Guid vehicleId, Guid companyId);
        Task SaveChangesAsync();
    }
}