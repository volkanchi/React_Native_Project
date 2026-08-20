using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IRouteService
    {
        Task<Response<RouteResponseDto>> CreateRouteAsync(Guid companyId, CreateRouteDto createDto);
        Task<Response<RouteResponseDto>> UpdateRouteAsync(Guid routeId, Guid companyId, UpdateRouteDto updateDto);
        Task<Response<bool>> DeleteRouteAsync(Guid routeId, Guid companyId);
    }
}