using NetTopologySuite;
using NetTopologySuite.Geometries;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace ServisTakipApi.Services
{
    public class RouteService : IRouteService
    {
        private readonly IRouteRepository _routeRepository;
        private readonly ILogger<RouteService> _logger;
        private readonly GeometryFactory _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

        public RouteService(IRouteRepository routeRepository, ILogger<RouteService> logger)
        {
            _routeRepository = routeRepository;
            _logger = logger;
        }

        public async Task<Response<RouteResponseDto>> CreateRouteAsync(Guid companyId, CreateRouteDto createDto)
        {
            try
            {
                var validationError = ValidateCreateRequest(createDto);
                if (validationError != null)
                    return Response<RouteResponseDto>.Fail(validationError);

                var resourceError = await _routeRepository.ValidateResourcesAsync(
                    companyId,
                    createDto.VehicleId,
                    createDto.DriverId,
                    createDto.Stops.Select(s => s.PassengerId));
                if (resourceError != null)
                    return Response<RouteResponseDto>.Fail(resourceError);

                var coordinates = createDto.PathCoordinates
                    .Select(c => new Coordinate(c.Longitude, c.Latitude))
                    .ToArray();

                var routePath = _geometryFactory.CreateLineString(coordinates);

                var newRoute = new Models.Route
                {
                    Name = createDto.Name,
                    CompanyId = companyId,
                    VehicleId = createDto.VehicleId,
                    DriverId = createDto.DriverId,
                    RoutePath = routePath,
                    Stops = createDto.Stops.Select(s => new RouteStop
                    {
                        StopOrder = s.StopOrder,
                        PassengerId = s.PassengerId,
                        Location = _geometryFactory.CreatePoint(new Coordinate(s.Location.Longitude, s.Location.Latitude))
                    }).ToList()
                };

                // Veritabanı kayıt işi
                var createdRoute = await _routeRepository.AddRouteAsync(newRoute);

                return Response<RouteResponseDto>.Successful("Rota başarıyla oluşturuldu.", ToResponse(createdRoute));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Route creation failed for company {CompanyId}", companyId);
                return Response<RouteResponseDto>.Fail("Rota oluşturulurken beklenmeyen bir hata meydana geldi.");
            }
        }

        public async Task<Response<RouteResponseDto>> UpdateRouteAsync(Guid routeId, Guid companyId, UpdateRouteDto updateDto)
        {
            try
            {
                if (updateDto == null || string.IsNullOrWhiteSpace(updateDto.Name))
                    return Response<RouteResponseDto>.Fail("Rota adı zorunludur.");

                var resourceError = await _routeRepository.ValidateResourcesAsync(
                    companyId,
                    updateDto.VehicleId,
                    updateDto.DriverId,
                    Array.Empty<Guid>());
                if (resourceError != null)
                    return Response<RouteResponseDto>.Fail(resourceError);

                var route = await _routeRepository.GetRouteByIdAndCompanyIdAsync(routeId, companyId);
                if (route == null)
                    return Response<RouteResponseDto>.Fail("Rota bulunamadı veya bu rota üzerinde yetkiniz yok.");

                route.Name = updateDto.Name;
                route.VehicleId = updateDto.VehicleId;
                route.DriverId = updateDto.DriverId;

                var updatedRoute = await _routeRepository.UpdateRouteAsync(route);
                return Response<RouteResponseDto>.Successful("Rota bilgileri güncellendi.", ToResponse(updatedRoute));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Route update failed for route {RouteId} and company {CompanyId}", routeId, companyId);
                return Response<RouteResponseDto>.Fail("Güncelleme sırasında beklenmeyen bir hata meydana geldi.");
            }
        }

        public async Task<Response<bool>> DeleteRouteAsync(Guid routeId, Guid companyId)
        {
            try
            {
                var isDeleted = await _routeRepository.SoftDeleteRouteAsync(routeId, companyId);
                if (!isDeleted)
                    return Response<bool>.Fail("Rota bulunamadı veya bu rota üzerinde yetkiniz yok.");

                return Response<bool>.Successful("Rota başarıyla silindi.", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Route deletion failed for route {RouteId} and company {CompanyId}", routeId, companyId);
                return Response<bool>.Fail("Silme işlemi sırasında beklenmeyen bir hata meydana geldi.");
            }
        }

        private static string? ValidateCreateRequest(CreateRouteDto? createDto)
        {
            if (createDto == null || string.IsNullOrWhiteSpace(createDto.Name))
                return "Rota adı zorunludur.";

            if (createDto.PathCoordinates == null || createDto.PathCoordinates.Count < 2)
                return "Rota yolu en az iki koordinat içermelidir.";

            if (createDto.Stops == null)
                return "Durak listesi zorunludur.";

            if (createDto.Stops.Any(s => s.Location == null))
                return "Her durağın konumu zorunludur.";

            var coordinates = createDto.PathCoordinates.Concat(createDto.Stops.Select(s => s.Location));
            if (coordinates.Any(c => c == null || !double.IsFinite(c.Latitude) || !double.IsFinite(c.Longitude) ||
                c.Latitude < -90 || c.Latitude > 90 || c.Longitude < -180 || c.Longitude > 180))
                return "Koordinatlar geçerli enlem ve boylam değerleri içermelidir.";

            if (createDto.Stops.Any(s => s.StopOrder < 1) ||
                createDto.Stops.GroupBy(s => s.StopOrder).Any(g => g.Count() > 1))
                return "Durak sıraları pozitif ve benzersiz olmalıdır.";

            return null;
        }

        private static RouteResponseDto ToResponse(Models.Route route)
        {
            return new RouteResponseDto
            {
                Id = route.Id,
                Name = route.Name,
                CompanyId = route.CompanyId,
                VehicleId = route.VehicleId,
                DriverId = route.DriverId,
                PathCoordinates = route.RoutePath?.Coordinates.Select(c => new CoordinateDto
                {
                    Latitude = c.Y,
                    Longitude = c.X
                }).ToList() ?? new List<CoordinateDto>(),
                Stops = route.Stops.OrderBy(s => s.StopOrder).Select(s => new RouteStopResponseDto
                {
                    Id = s.Id,
                    StopOrder = s.StopOrder,
                    PassengerId = s.PassengerId,
                    Location = new CoordinateDto
                    {
                        Latitude = s.Location.Y,
                        Longitude = s.Location.X
                    },
                    IsActive = s.IsActive
                }).ToList()
            };
        }
    }
}