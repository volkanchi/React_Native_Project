using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IRouteService
    {
        Task<Response<RouteResponseDto>> CreateRouteAsync(Guid companyId, CreateRouteDto createDto);
        Task<Response<RouteResponseDto>> UpdateRouteAsync(Guid routeId, Guid companyId, UpdateRouteDto updateDto);
        Task<Response<bool>> DeleteRouteAsync(Guid routeId, Guid companyId);
        Task<Response<Guid>> JoinRouteAsync(Guid passengerId, JoinRouteDto joinDto);
        Task<Response<bool>> UpdateStopLocationAsync(Guid passengerId, Guid routeId, UpdateStopLocationDto updateDto);
        Task<Response<bool>> LeaveRouteAsync(Guid passengerId, Guid routeId);
        Task<Response<IEnumerable<object>>> GetPassengerRoutesAsync(Guid passengerId);
        Task<Response<RouteResponseDto>> GetPassengerRouteAsync(Guid passengerId, Guid routeId);
        Task<Response<object>> GetDriverActiveRouteAsync(Guid userId);
        Task<Response<RoutePreviewResponseDto>> PreviewRouteForJoinAsync(string routeCode);
        Task<Response<IEnumerable<RouteResponseDto>>> GetRoutesByCompanyAsync(Guid companyId);
        Task<Response<object>> GetDriverActiveRouteAsync(Guid userId, Guid? routeId = null);
        Task<Response<IEnumerable<object>>> GetDriverRoutesAsync(Guid userId);
    }
}