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
                    Array.Empty<Guid>());
                if (resourceError != null)
                    return Response<RouteResponseDto>.Fail(resourceError);

                var coordinates = createDto.PathCoordinates
                    .Select(c => new Coordinate(c.Longitude, c.Latitude))
                    .ToArray();

                var routePath = _geometryFactory.CreateLineString(coordinates);


                var plateNumber = await _routeRepository.GetVehiclePlateByIdAsync(createDto.VehicleId, companyId);
                if (string.IsNullOrEmpty(plateNumber))
                {
                    return Response<RouteResponseDto>.Fail("Araç bulunamadı veya plakası geçersiz.");
                }

                // 2. Plakadaki boşlukları temizle (Örn: "34 ABC 123" -> "34ABC123") ve 4 haneli rastgele sayı üret
                var cleanPlate = plateNumber.Replace(" ", "").ToUpper();
                var randomSuffix = new Random().Next(1000, 10000).ToString(); // 1000 ile 9999 arası sayı
                var generatedRouteCode = $"{cleanPlate}-{randomSuffix}"; // Örn: 34ABC123-8472

                // 3. Rota Nesnesini Oluştur
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

            var coordinates = createDto.PathCoordinates.Concat(createDto.Stops.Select(s => s.Location));
            if (coordinates.Any(c => c == null || !double.IsFinite(c.Latitude) || !double.IsFinite(c.Longitude) ||
                c.Latitude < -90 || c.Latitude > 90 || c.Longitude < -180 || c.Longitude > 180))
                return "Koordinatlar geçerli enlem ve boylam değerleri içermelidir.";
            return null;
        }

        private static RouteResponseDto ToResponse(Models.Route route)
        {
            return new RouteResponseDto
            {
                Id = route.Id,
                RouteCode = route.RouteCode,
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
        public async Task<Response<Guid>> JoinRouteAsync(Guid passengerId, JoinRouteDto joinDto)
        {
            var route = await _routeRepository.GetRouteByCodeAsync(joinDto.RouteCode);
            if (route == null) return Response<Guid>.Fail("Geçersiz veya silinmiş bir servis kodu girdiniz.");

            if (route.Stops.Any(s => s.PassengerId == passengerId))
                return Response<Guid>.Fail("Bu servise zaten kayıtlısınız.");

            // 1. Yeni durağı oluştur
            var newStop = new RouteStop
            {
                RouteId = route.Id,
                PassengerId = passengerId,
                IsActive = true,
                // Konumu başlangıçta 0,0 olarak belirliyoruz. Kullanıcı sonra güncelleyecek.
                Location = _geometryFactory.CreatePoint(new Coordinate(0, 0))
            };

            // 2. Yeni durağı rotanın hafızadaki durak listesine ekle
            route.Stops.Add(newStop);

            // 3. Tüm durakları harita çizgisine göre yeniden sırala (StopOrder'ları günceller)
            ReorderRouteStops(route);

            // 4. Veritabanına kaydet
            await _routeRepository.AddRouteStopAndUpdateOrdersAsync(
                newStop,
                route.Stops.Where(s => s.Id != newStop.Id));

            return Response<Guid>.Successful("Servise başarıyla katıldınız.", route.Id);
        }

        public async Task<Response<bool>> UpdateStopLocationAsync(Guid passengerId, Guid routeId, UpdateStopLocationDto updateDto)
        {
            // Artık sadece durağı değil, çizgiyi de (Route) getirmeliyiz ki sırayı hesaplayabilelim
            var route = await _routeRepository.GetRouteWithStopsByIdAsync(routeId);
            if (route == null) return Response<bool>.Fail("Rota bulunamadı.");

            var stop = route.Stops.FirstOrDefault(s => s.PassengerId == passengerId);
            if (stop == null) return Response<bool>.Fail("Bu servise ait bir kaydınız bulunamadı.");

            // 1. Konumu güncelle
            stop.Location = _geometryFactory.CreatePoint(new Coordinate(updateDto.NewLocation.Longitude, updateDto.NewLocation.Latitude));

            // 2. Konum değiştiği için durağın sırası (StopOrder) değişmiş olabilir, yeniden sırala!
            ReorderRouteStops(route);

            // 3. Tüm güncellemeleri veritabanına yansıt
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
        // YARDIMCI METOT: Durakları harita çizgisine (Polyline) göre sıraya dizer
        private void ReorderRouteStops(Models.Route route)
        {
            if (route.RoutePath == null || !route.Stops.Any()) return;

            // 1. Ana rotayı indekslenebilir bir matematiksel çizgiye çevir
            var indexedLine = new NetTopologySuite.LinearReferencing.LengthIndexedLine(route.RoutePath);

            // 2. Her durağın konumunu ana çizgiye yansıt (izdüşüm) ve mesafesine (Project) göre küçükten büyüğe sırala
            var sortedStops = route.Stops
                .Select(stop => new
                {
                    Stop = stop,
                    ProjectedIndex = indexedLine.Project(stop.Location.Coordinate)
                })
                .OrderBy(x => x.ProjectedIndex)
                .ToList();

            // 3. Sıralanmış listeye 1'den başlayarak yeni durak sıralarını (StopOrder) ata
            int order = 1;
            foreach (var item in sortedStops)
            {
                item.Stop.StopOrder = order++;
            }
        }
        public async Task<Response<IEnumerable<object>>> GetPassengerRoutesAsync(Guid passengerId)
        {
            var routes = await _routeRepository.GetRoutesByPassengerIdAsync(passengerId);

            // Frontend'in liste ekranında ihtiyaç duyacağı özet bilgileri hazırlıyoruz
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
        public async Task<Response<object>> GetDriverActiveRouteAsync(Guid userId)
        {
            var route = await _routeRepository.GetActiveRouteByDriverUserIdAsync(userId);

            if (route == null)
                return Response<object>.Fail("Üzerinize atanmış aktif bir rota bulunamadı.");

            var result = new
            {
                RouteId = route.Id,
                Name = route.Name,
                RouteCode = route.RouteCode,
                Plate = route.Vehicle?.PlateNumber ?? "Araç Atanmadı",
                VehicleModel = route.Vehicle?.BrandAndModel ?? "Bilinmiyor",
                Capacity = route.Vehicle?.Capacity ?? 0,
                Stops = route.Stops.OrderBy(s => s.StopOrder).Select(s => new
                {
                    Id = s.Id,
                    PassengerId = s.PassengerId,
                    Label = $"Durak {s.StopOrder}", // İleride yolcu isimleri de çekilebilir
                    Time = "Bekleniyor",
                    Latitude = s.Location.Y,
                    Longitude = s.Location.X,
                    IsActive = s.IsActive
                })
            };

            return Response<object>.Successful("Aktif rota getirildi.", result);
        }
    }
}