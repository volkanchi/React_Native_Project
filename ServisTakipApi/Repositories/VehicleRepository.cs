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
            // 1. Atanacak aracı tam nesne olarak çekiyoruz (Sadece Any ile kontrol etmiyoruz)
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v =>
                v.Id == vehicleId && v.CompanyId == companyId && !v.Deleted);

            if (vehicle == null) return false;

            // 2. Şoförü buluyoruz (Include ile User tablosunu da bağlıyoruz)
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d =>
                    d.Id == driverId &&
                    d.User.CompanyId == companyId &&
                    d.User.Role == UserRole.Sofor &&
                    !d.User.Deleted);

            if (driver == null) return false;

            // 3. Şoför tablosundaki DİĞER BİLGİLERİ araç ile senkronize et
            driver.VehicleId = vehicleId;
            driver.PlateNumber = vehicle.PlateNumber; // Araç plakası şoföre kopyalandı
            driver.Capacity = vehicle.Capacity;       // Araç kapasitesi şoföre kopyalandı

            return true;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}