using Microsoft.EntityFrameworkCore;
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

            var driverIsValid = await _context.Users.AnyAsync(u =>
                u.Id == driverId && u.CompanyId == companyId &&
                u.Role == UserRole.Sofor && !u.Deleted);
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
    }
}