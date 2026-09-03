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
        private readonly IMapService _mapService;
        private readonly GeometryFactory _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

        public RouteService(
            IRouteRepository routeRepository,
            ILogger<RouteService> logger,
            IMapService mapService)
        {
            _routeRepository = routeRepository;
            _logger = logger;
            _mapService = mapService;
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
                    Array.Empty<Guid>());

                if (resourceError != null)
                    return Response<RouteResponseDto>.Fail(resourceError);

                LineString? routePath = null;
                if (createDto.PathCoordinates != null && createDto.PathCoordinates.Count >= 2)
                {
                    var coordinates = createDto.PathCoordinates
                        .Select(c => new Coordinate(c.Longitude, c.Latitude))
                        .ToArray();
                    routePath = _geometryFactory.CreateLineString(coordinates);
                }

                var plateNumber = await _routeRepository.GetVehiclePlateByIdAsync(createDto.VehicleId, companyId);
                if (string.IsNullOrEmpty(plateNumber))
                {
                    return Response<RouteResponseDto>.Fail("Araç bulunamadı veya plakası geçersiz.");
                }

                var cleanPlate = plateNumber.Replace(" ", "").ToUpper();
                var randomSuffix = new Random().Next(1000, 10000).ToString();
                var generatedRouteCode = $"{cleanPlate}-{randomSuffix}";

                var newRoute = new Models.Route
                {
                    RouteCode = generatedRouteCode,
                    Name = createDto.Name,
                    CompanyId = companyId,
                    VehicleId = createDto.VehicleId,
                    DriverId = createDto.DriverId,
                    RoutePath = routePath,
                    Stops = new List<RouteStop>()
                };

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

        public async Task<Response<IEnumerable<RouteResponseDto>>> GetRoutesByCompanyAsync(Guid companyId)
        {
            try
            {
                var routes = await _routeRepository.GetRoutesByCompanyIdAsync(companyId);
                var result = routes.Select(ToResponse);
                return Response<IEnumerable<RouteResponseDto>>.Successful(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch routes for company {CompanyId}", companyId);
                return Response<IEnumerable<RouteResponseDto>>.Fail("Rotalar getirilirken bir hata oluştu.");
            }
        }

        private static string? ValidateCreateRequest(CreateRouteDto? createDto)
        {
            if (createDto == null || string.IsNullOrWhiteSpace(createDto.Name))
                return "Rota adı zorunludur.";

            if (createDto.PathCoordinates != null && createDto.PathCoordinates.Count == 1)
                return "Eğer rota yolu çizilecekse en az iki koordinat içermelidir.";

            return null;
        }

         private static RouteResponseDto ToResponse(Models.Route route)
        {
            var pathCoords = route.RoutePath?.Coordinates;
            var orderedStops = route.Stops.OrderBy(s => s.StopOrder).ToList();

            double? startLat = pathCoords is { Length: > 0 } ? pathCoords.First().Y : orderedStops.FirstOrDefault()?.Location.Y;
            double? startLng = pathCoords is { Length: > 0 } ? pathCoords.First().X : orderedStops.FirstOrDefault()?.Location.X;
            double? endLat = pathCoords is { Length: > 0 } ? pathCoords.Last().Y : orderedStops.LastOrDefault()?.Location.Y;
            double? endLng = pathCoords is { Length: > 0 } ? pathCoords.Last().X : orderedStops.LastOrDefault()?.Location.X;

            return new RouteResponseDto
            {
                Id = route.Id,
                RouteCode = route.RouteCode,
                Name = route.Name,
                CompanyId = route.CompanyId,
                VehicleId = route.VehicleId,
                DriverId = route.DriverId,
                StartLatitude = startLat,
                StartLongitude = startLng,
                EndLatitude = endLat,
                EndLongitude = endLng,
                PathCoordinates = route.RoutePath?.Coordinates.Select(c => new CoordinateDto
                {
                    Latitude = c.Y,
                    Longitude = c.X
                }).ToList() ?? new List<CoordinateDto>(),
                Stops = orderedStops.Select(s => new RouteStopResponseDto
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

        public async Task<Response<Guid>> JoinRouteAsync(Guid passengerId, JoinRouteDto joinDto)
        {
            var route = await _routeRepository.GetRouteByCodeAsync(joinDto.RouteCode);
            if (route == null) return Response<Guid>.Fail("Geçersiz veya silinmiş bir servis kodu girdiniz.");

            if (route.Stops.Any(s => s.PassengerId == passengerId))
                return Response<Guid>.Fail("Bu servise zaten kayıtlısınız.");

            var newStop = new RouteStop
            {
                RouteId = route.Id,
                PassengerId = passengerId,
                IsActive = true,
                Location = _geometryFactory.CreatePoint(new Coordinate(joinDto.Location.Longitude, joinDto.Location.Latitude))
            };

            route.Stops.Add(newStop);
            ReorderRouteStops(route);

            await _routeRepository.AddRouteStopAndUpdateOrdersAsync(
                newStop,
                route.Stops.Where(s => s.Id != newStop.Id));

            return Response<Guid>.Successful("Servise başarıyla katıldınız.", route.Id);
        }

        public async Task<Response<bool>> UpdateStopLocationAsync(Guid passengerId, Guid routeId, UpdateStopLocationDto updateDto)
        {
            var route = await _routeRepository.GetRouteWithStopsByIdAsync(routeId);
            if (route == null) return Response<bool>.Fail("Rota bulunamadı.");

            var stop = route.Stops.FirstOrDefault(s => s.PassengerId == passengerId);
            if (stop == null) return Response<bool>.Fail("Bu servise ait bir kaydınız bulunamadı.");

            stop.Location = _geometryFactory.CreatePoint(new Coordinate(updateDto.NewLocation.Longitude, updateDto.NewLocation.Latitude));
            ReorderRouteStops(route);

            await _routeRepository.UpdateRouteStopsAsync(route.Stops);
            return Response<bool>.Successful("Konumunuz başarıyla güncellendi.", true);
        }

        public async Task<Response<bool>> LeaveRouteAsync(Guid passengerId, Guid routeId)
        {
            var route = await _routeRepository.GetRouteWithStopsByIdAsync(routeId);
            if (route == null) return Response<bool>.Fail("Rota bulunamadı.");

            var stop = route.Stops.FirstOrDefault(s => s.PassengerId == passengerId);
            if (stop == null) return Response<bool>.Fail("Bu serviste zaten kaydınız yok.");

            route.Stops.Remove(stop);
            ReorderRouteStops(route);
            await _routeRepository.RemoveRouteStopAndUpdateOrdersAsync(stop, route.Stops);
            return Response<bool>.Successful("Servisten başarıyla ayrıldınız.", true);
        }

        private void ReorderRouteStops(Models.Route route)
        {
            if (route.RoutePath == null || !route.Stops.Any()) return;

            var indexedLine = new NetTopologySuite.LinearReferencing.LengthIndexedLine(route.RoutePath);

            var sortedStops = route.Stops
                .Select(stop => new
                {
                    Stop = stop,
                    ProjectedIndex = indexedLine.Project(stop.Location.Coordinate)
                })
                .OrderBy(x => x.ProjectedIndex)
                .ToList();

            int order = 1;
            foreach (var item in sortedStops)
            {
                item.Stop.StopOrder = order++;
            }
        }

        public async Task<Response<IEnumerable<object>>> GetPassengerRoutesAsync(Guid passengerId)
        {
            var routes = await _routeRepository.GetRoutesByPassengerIdAsync(passengerId);

            var result = routes.Select(r => new
            {
                Id = r.Id,
                Name = r.Name,
                RouteCode = r.RouteCode,
                Plate = r.Vehicle?.PlateNumber ?? "Araç Yok",
                DriverName = r.Driver != null ? $"{r.Driver.User.Name} {r.Driver.User.Surname}" : "Atanmadı",
                Capacity = r.Vehicle?.Capacity ?? 0,
                Occupancy = r.Stops.Count(s => s.IsActive)
            });

            return Response<IEnumerable<object>>.Successful("Rotalar başarıyla getirildi.", result);
        }

       public async Task<Response<RouteResponseDto>> GetPassengerRouteAsync(Guid passengerId, Guid routeId)
        {
            var route = await _routeRepository.GetRouteWithStopsByIdAsync(routeId);
            if (route == null || !route.Stops.Any(s => s.PassengerId == passengerId))
                return Response<RouteResponseDto>.Fail("Rota bulunamadı veya bu rotaya dahil değilsiniz.");

            return Response<RouteResponseDto>.Successful("Rota detayları başarıyla getirildi.", ToResponse(route));
        }

        public async Task<Response<RoutePreviewResponseDto>> PreviewRouteForJoinAsync(string routeCode)
        {
            try
            {
                var route = await _routeRepository.GetRouteByCodeAsync(routeCode);
                if (route == null)
                    return Response<RoutePreviewResponseDto>.Fail("Geçersiz veya silinmiş servis kodu.");

                // 1. Haritada mavi pin olarak gösterilecek kayıtlı yolcu durakları
                var existingStops = route.Stops
                    .Where(s => s.Location != null)
                    .OrderBy(s => s.StopOrder)
                    .Select(s => new ExistingStopDto
                    {
                        Label = s.Passenger != null && !string.IsNullOrWhiteSpace(s.Passenger.Name)
                    ? $"{s.Passenger.Name} {s.Passenger.Surname}".Trim()
                    : $"Durak {s.StopOrder}",
                        Latitude = s.Location.Y,
                        Longitude = s.Location.X
                    })
                    .ToList();
                Console.WriteLine($"🔍 [PreviewRoute] '{route.Name}' için bulunan durak sayısı: {existingStops.Count}");

                // 2. Güzergah polyline çizgisi koordinatları
                List<CoordinateDto> pathCoordinates = new();

                if (route.RoutePath != null && route.RoutePath.Coordinates.Length >= 2)
                {
                    pathCoordinates = route.RoutePath.Coordinates
                        .Select(c => new CoordinateDto
                        {
                            Latitude = c.Y,
                            Longitude = c.X
                        })
                        .ToList();
                }
                else if (existingStops.Count >= 2)
                {
                    var stopCoords = existingStops.Select(s => new CoordinateDto
                    {
                        Latitude = s.Latitude,
                        Longitude = s.Longitude
                    }).ToList();

                    var calculatedPolyline = await _mapService.GetRoutePolylineAsync(stopCoords);
                    if (calculatedPolyline != null && calculatedPolyline.Count > 0)
                    {
                        pathCoordinates = calculatedPolyline;
                    }
                }

                var responseDto = new RoutePreviewResponseDto
                {
                    RouteId = route.Id,
                    Name = route.Name,
                    RouteCode = route.RouteCode,
                    ExistingStops = existingStops,
                    PathCoordinates = pathCoordinates
                };

                return Response<RoutePreviewResponseDto>.Successful("Rota önizlemesi getirildi.", responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PreviewRouteForJoinAsync hatası: {RouteCode}", routeCode);
                return Response<RoutePreviewResponseDto>.Fail("Rota önizlemesi yüklenirken hata oluştu.");
            }
        }

        public async Task<Response<object>> GetDriverActiveRouteAsync(Guid userId, Guid? routeId = null)
        {
            var route = routeId.HasValue
                ? await _routeRepository.GetRouteByIdAndDriverUserIdAsync(routeId.Value, userId)
                : await _routeRepository.GetActiveRouteByDriverUserIdAsync(userId);

            if (route == null)
                return Response<object>.Fail("Üzerinize atanmış aktif bir rota bulunamadı.");

            return Response<object>.Successful("Aktif rota getirildi.", ToDriverRouteDto(route));
        }

        public async Task<Response<IEnumerable<object>>> GetDriverRoutesAsync(Guid userId)
        {
            try
            {
                var routes = await _routeRepository.GetRoutesByDriverUserIdAsync(userId);
                var result = routes.Select(r => new
                {
                    RouteId = r.Id,
                    Name = r.Name,
                    RouteCode = r.RouteCode,
                    Plate = r.Vehicle?.PlateNumber ?? "Araç Atanmadı"
                });

                return Response<IEnumerable<object>>.Successful("Servisler getirildi.", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch driver routes for user {UserId}", userId);
                return Response<IEnumerable<object>>.Fail("Servisler getirilirken bir hata oluştu.");
            }
        }

        private static object ToDriverRouteDto(Models.Route route)
        {
            // RoutePath (şirketin çizdiği ORS güzergahı) varsa gerçek Başlangıç/Bitiş
            // koordinatlarını oradan al; yoksa duraklara düş. Önceki sürümde bu alanlar
            // hiç dönmüyordu ve frontend her rota için aynı sabit (hardcoded) koordinatlara
            // düşüyordu — farklı rotaların polyline'ları bu yüzden üst üste biniyordu.
            var pathCoords = route.RoutePath?.Coordinates;
            var orderedStops = route.Stops.OrderBy(s => s.StopOrder).ToList();

            double? startLat = pathCoords is { Length: > 0 } ? pathCoords.First().Y : orderedStops.FirstOrDefault()?.Location.Y;
            double? startLng = pathCoords is { Length: > 0 } ? pathCoords.First().X : orderedStops.FirstOrDefault()?.Location.X;
            double? endLat = pathCoords is { Length: > 0 } ? pathCoords.Last().Y : orderedStops.LastOrDefault()?.Location.Y;
            double? endLng = pathCoords is { Length: > 0 } ? pathCoords.Last().X : orderedStops.LastOrDefault()?.Location.X;

            return new
            {
                RouteId = route.Id,
                Name = route.Name,
                RouteCode = route.RouteCode,
                Plate = route.Vehicle?.PlateNumber ?? "Araç Atanmadı",
                VehicleModel = route.Vehicle?.BrandAndModel ?? "Bilinmiyor",
                Capacity = route.Vehicle?.Capacity ?? 0,
                StartLatitude = startLat,
                StartLongitude = startLng,
                EndLatitude = endLat,
                EndLongitude = endLng,
                StartPointName = "Başlangıç Noktası",
                EndPointName = "Varış Noktası",
                Stops = orderedStops.Select(s => new
                {
                    Id = s.Id,
                    PassengerId = s.PassengerId,
                    PassengerName = s.Passenger != null
                        ? $"{s.Passenger.Name} {s.Passenger.Surname}"
                        : $"Durak {s.StopOrder}",
                    Label = $"Durak {s.StopOrder}",
                    Time = "Bekleniyor",
                    Latitude = s.Location.Y,
                    Longitude = s.Location.X,
                    IsActive = s.IsActive
                })
            };
        }
    }
}