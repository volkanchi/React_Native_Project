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
        Task<Models.Route> UpdateRouteAsync(Models.Route route);
        Task<bool> SoftDeleteRouteAsync(Guid routeId, Guid companyId);
    }
}