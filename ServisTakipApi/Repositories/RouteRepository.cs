using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using ServisTakipApi.Context;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.Repositories
{
    public class RouteRepository : IRouteRepository
    {
        private readonly AppDbContext _context;

        public RouteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Models.Route> AddRouteAsync(Models.Route route)
        {
            _context.Routes.Add(route);
            await _context.SaveChangesAsync();
            return route;
        }

        public async Task<string?> ValidateResourcesAsync(Guid companyId, Guid vehicleId, Guid driverId, IEnumerable<Guid> passengerIds)
        {
            var vehicleIsValid = await _context.Vehicles.AnyAsync(v =>
                v.Id == vehicleId && v.CompanyId == companyId && !v.Deleted);
            if (!vehicleIsValid)
                return "Seçilen araç bulunamadı, firmaya ait değil veya pasif durumda.";

            var driverIsValid = await _context.Drivers.AnyAsync(d =>
                d.Id == driverId && d.User.CompanyId == companyId &&
                d.User.Role == UserRole.Sofor && !d.User.Deleted);
            if (!driverIsValid)
                return "Seçilen şoför bulunamadı, firmaya ait değil veya pasif durumda.";

            var distinctPassengerIds = passengerIds.Distinct().ToArray();
            var validPassengerCount = await _context.Users.CountAsync(u =>
                distinctPassengerIds.Contains(u.Id) &&
                u.CompanyId == companyId && u.Role == UserRole.Yolcu && !u.Deleted);

            return validPassengerCount == distinctPassengerIds.Length
                ? null
                : "Bir veya daha fazla yolcu bulunamadı, firmaya ait değil veya pasif durumda.";
        }
        public async Task<Models.Route?> GetRouteByIdAndCompanyIdAsync(Guid routeId, Guid companyId)
        {
            return await _context.Routes
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.CompanyId == companyId && !r.Deleted);
        }
        public async Task<string?> GetVehiclePlateByIdAsync(Guid vehicleId, Guid companyId)
        {
            // Aracı bul ve sadece plakasını döndür (Güvenlik için CompanyId kontrolü de yapıyoruz)
            var vehicle = await _context.Vehicles
                .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CompanyId == companyId && !v.Deleted);

            return vehicle?.PlateNumber;
        }

        public async Task<Models.Route> UpdateRouteAsync(Models.Route route)
        {
            _context.Routes.Update(route);
            await _context.SaveChangesAsync();
            return route;
        }

        public async Task<bool> SoftDeleteRouteAsync(Guid routeId, Guid companyId)
        {
            var route = await GetRouteByIdAndCompanyIdAsync(routeId, companyId);
            if (route == null) return false;

            route.Deleted = true;
            // İleride buraya DeleteDate ve DeleteUser da eklenebilir

            _context.Routes.Update(route);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteRouteAsync(Guid routeId, Guid companyId, Guid? actionUserId)
        {
            var route = await GetRouteByIdAndCompanyIdAsync(routeId, companyId);
            if (route == null) return false;

            route.Deleted = true;

            _context.Routes.Update(route);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Models.Route>> GetRoutesByCompanyIdAsync(Guid companyId)
        {
            return await _context.Routes
                .Include(r => r.Stops)
                .Include(r => r.Vehicle)
                .Include(r => r.Driver).ThenInclude(d => d!.User)
                .Where(r => r.CompanyId == companyId && !r.Deleted)
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task<Models.Route?> GetRouteByCodeAsync(string routeCode)
        {
            // Koda göre rotayı buluruz (Silinmemiş olmalı)
            return await _context.Routes
                .Include(r => r.Stops) // Durakları (yolcular) da dahil et ki sırayı (StopOrder) hesaplayabilelim
                .FirstOrDefaultAsync(r => r.RouteCode == routeCode && !r.Deleted);
        }

        public async Task<RouteStop?> GetRouteStopAsync(Guid routeId, Guid passengerId)
        {
            return await _context.RouteStops
                .FirstOrDefaultAsync(rs => rs.RouteId == routeId && rs.PassengerId == passengerId);
        }

        public async Task<RouteStop> AddRouteStopAsync(RouteStop stop)
        {
            _context.RouteStops.Add(stop);
            await _context.SaveChangesAsync();
            return stop;
        }

        public async Task<RouteStop> UpdateRouteStopAsync(RouteStop stop)
        {
            _context.RouteStops.Update(stop);
            await _context.SaveChangesAsync();
            return stop;
        }

        public async Task<bool> RemoveRouteStopAsync(RouteStop stop)
        {
            _context.RouteStops.Remove(stop);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task AddRouteStopAndUpdateOrdersAsync(RouteStop newStop, IEnumerable<RouteStop> existingStops)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            _context.RouteStops.Add(newStop);
            _context.RouteStops.UpdateRange(existingStops);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }

        public async Task RemoveRouteStopAndUpdateOrdersAsync(RouteStop stop, IEnumerable<RouteStop> remainingStops)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            _context.RouteStops.Remove(stop);
            _context.RouteStops.UpdateRange(remainingStops);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }

        public async Task<Models.Route?> GetRouteWithStopsByIdAsync(Guid routeId)
        {
            return await _context.Routes
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == routeId && !r.Deleted);
        }

        public async Task UpdateRouteStopsAsync(IEnumerable<RouteStop> stops)
        {
            _context.RouteStops.UpdateRange(stops);
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<Models.Route>> GetRoutesByPassengerIdAsync(Guid passengerId)
        {
            // Yolcunun dahil olduğu rotaları; durak, araç ve şoför bilgileriyle birlikte (JOIN) çekiyoruz

            return await _context.Routes
                .Include(r => r.Stops)
                .Include(r => r.Vehicle)
                .Include(r => r.Driver).ThenInclude(d => d!.User)
                .Where(r => r.Stops.Any(s => s.PassengerId == passengerId) && !r.Deleted)
                .AsNoTracking()
                .ToListAsync();

        }
        public async Task<Models.Route?> GetActiveRouteByDriverUserIdAsync(Guid userId)
        {
            // Şoför (Driver) tablosu ile Rota (Route) tablosunu UserId üzerinden eşleştirerek aktif rotayı buluyoruz
            return await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Stops)
                .Join(_context.Drivers,
                      route => route.DriverId,
                      driver => driver.Id,
                      (route, driver) => new { Route = route, Driver = driver })
                .Where(x => x.Driver.UserId == userId && !x.Route.Deleted)
                .Select(x => x.Route)
                .FirstOrDefaultAsync();
        }
    }
}