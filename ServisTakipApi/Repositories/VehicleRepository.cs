using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Context;
using ServisTakipApi.Models;

namespace ServisTakipApi.Repositories
{
    public class VehicleRepository : IVehicleRepository
    {
        private readonly AppDbContext _context;

        public VehicleRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Vehicle> AddAsync(Vehicle vehicle)
        {
            await _context.Vehicles.AddAsync(vehicle);
            return vehicle;
        }

        public async Task<bool> PlateExistsAsync(string plateNumber, Guid companyId)
        {
            return await _context.Vehicles.AnyAsync(v =>
                v.CompanyId == companyId &&
                v.PlateNumber == plateNumber &&
                !v.Deleted);
        }

        public async Task<IEnumerable<Vehicle>> GetVehiclesByCompanyIdAsync(Guid companyId)
        {
            return await _context.Vehicles
                .Where(v => v.CompanyId == companyId && !v.Deleted) 
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> AssignDriverAsync(Guid driverId, Guid vehicleId, Guid companyId)
        {
            var vehicleExists = await _context.Vehicles.AnyAsync(v =>
                v.Id == vehicleId && v.CompanyId == companyId && !v.Deleted);
            if (!vehicleExists)
                return false;

            var driver = await _context.Drivers
                .Join(_context.Users,
                    profile => profile.UserId,
                    user => user.Id,
                    (profile, user) => new { Profile = profile, User = user })
                .Where(x => x.Profile.Id == driverId &&
                            x.User.CompanyId == companyId &&
                            x.User.Role == UserRole.Sofor &&
                            !x.User.Deleted)
                .Select(x => x.Profile)
                .FirstOrDefaultAsync();

            if (driver == null)
                return false;

            driver.VehicleId = vehicleId;
            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}