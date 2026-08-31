using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IRouteRepository
    {
        Task<Models.Route> AddRouteAsync(Models.Route route);
        Task<string?> ValidateResourcesAsync(Guid companyId, Guid vehicleId, Guid driverId, IEnumerable<Guid> passengerIds);
        Task<Models.Route?> GetRouteByIdAndCompanyIdAsync(Guid routeId, Guid companyId);
        Task<string?> GetVehiclePlateByIdAsync(Guid vehicleId, Guid companyId);
        Task<Models.Route> UpdateRouteAsync(Models.Route route);
        Task<bool> SoftDeleteRouteAsync(Guid routeId, Guid companyId);
        Task<Models.Route?> GetRouteByCodeAsync(string routeCode);
        Task<RouteStop?> GetRouteStopAsync(Guid routeId, Guid passengerId);
        Task<RouteStop> AddRouteStopAsync(RouteStop stop);
        Task<RouteStop> UpdateRouteStopAsync(RouteStop stop);
        Task<bool> RemoveRouteStopAsync(RouteStop stop);
        Task AddRouteStopAndUpdateOrdersAsync(RouteStop newStop, IEnumerable<RouteStop> existingStops);
        Task RemoveRouteStopAndUpdateOrdersAsync(RouteStop stop, IEnumerable<RouteStop> remainingStops);
        Task<Models.Route?> GetRouteWithStopsByIdAsync(Guid routeId);
        Task UpdateRouteStopsAsync(IEnumerable<RouteStop> stops);
        Task<IEnumerable<Models.Route>> GetRoutesByPassengerIdAsync(Guid passengerId);
    }
}