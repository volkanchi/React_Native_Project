using System.Net.Http.Json;
using System.Text.Json;
using ServisTakipApi.DTOs.RouteDTOs;

namespace ServisTakipApi.Services
{
    public class RoutePolylineResult
    {
        public List<CoordinateDto> Coordinates { get; set; } = new();
        public string? ErrorDetail { get; set; }
    }
    public interface IMapService
    {
        Task<RoutePolylineResult> GetRoutePolylineAsync(List<CoordinateDto> stops);
    }

    public class MapService : IMapService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public MapService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }
        private const int MaxOrsWaypoints = 70;

       // ORS'in tek istekte kabul ettiği maksimum waypoint sayısını aşan
       // (örn. daha önce ORS'ten dönmüş, yüzlerce noktalı bir polyline'ın
        // tekrar 'coordinates' olarak yollandığı) durumlarda, ilk/son nokta
        // korunarak eşit aralıklarla seyreltme yapar.
        private static List<CoordinateDto> DownsampleIfNeeded(List<CoordinateDto> points)
        {
            if (points.Count <= MaxOrsWaypoints) return points;

            var step = (double)(points.Count - 1) / (MaxOrsWaypoints - 1);
            var sampled = new List<CoordinateDto>(MaxOrsWaypoints);
            for (int i = 0; i < MaxOrsWaypoints; i++)
            {
                sampled.Add(points[(int)Math.Round(i * step)]);
            }
                        return sampled;
        }

        public async Task<RoutePolylineResult> GetRoutePolylineAsync(List<CoordinateDto> stops)
         {
             try
             {
                 var apiKey = _configuration["ORS_API_KEY"];
                 if (string.IsNullOrWhiteSpace(apiKey))
                 {
                     const string msg = "ORS_API_KEY appsettings.json içinde tanımlı değil.";
                     Console.WriteLine($"❌ [MapService] {msg}");
                     return new RoutePolylineResult { ErrorDetail = msg };
                 }
 
                 if (stops == null || stops.Count < 2)
                 {
                     const string msg = "Rota çizimi için en az 2 durak noktası gereklidir.";
                     Console.WriteLine($"⚠️ [MapService] {msg}");
                     return new RoutePolylineResult { ErrorDetail = msg };
                 }
 
                stops = DownsampleIfNeeded(stops);

                const string url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

                var coordinates = stops.Select(s => new[] { s.Longitude, s.Latitude }).ToArray();
                var radiuses = stops.Select(_ => -1).ToArray(); // Noktaları en yakın yola bağlar

                using var request = new HttpRequestMessage(HttpMethod.Post, url);

                request.Headers.TryAddWithoutValidation("Authorization", apiKey.Trim());
                request.Headers.TryAddWithoutValidation("Accept", "application/json, application/geo+json");

                request.Content = JsonContent.Create(new
                {
                    coordinates = coordinates,
                    radiuses = radiuses
                });

                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    var msg = $"ORS API Hatası ({response.StatusCode}): {responseBody}";
                    Console.WriteLine($"❌ [ORS API Hatası] Status: {response.StatusCode} | Detay: {responseBody}");
                    return new RoutePolylineResult { ErrorDetail = msg };
                }

                using var doc = JsonDocument.Parse(responseBody);
                var features = doc.RootElement.GetProperty("features");
                if (features.GetArrayLength() == 0)
                {
                    const string msg = "ORS rota bulamadı (features boş). Noktalar yol ağına çok uzak veya erişilemez olabilir.";
                    Console.WriteLine($"⚠️ [MapService] {msg}");
                    return new RoutePolylineResult { ErrorDetail = msg };
                }

                var polylineCoords = features[0]
                    .GetProperty("geometry")
                    .GetProperty("coordinates");

                var result = new List<CoordinateDto>();
                foreach (var item in polylineCoords.EnumerateArray())
                {
                    result.Add(new CoordinateDto
                    {
                        Longitude = item[0].GetDouble(),
                        Latitude = item[1].GetDouble()
                    });
                }

                Console.WriteLine($"✅ [MapService] Rota başarıyla çizildi. Toplam {result.Count} koordinat.");
                return new RoutePolylineResult { Coordinates = result };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [MapService Hatası]: {ex.Message}");
                return new RoutePolylineResult { ErrorDetail = ex.Message };
            }
        }
    }
}