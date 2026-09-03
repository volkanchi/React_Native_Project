using System.Net.Http.Json;
using System.Text.Json;
using ServisTakipApi.DTOs.RouteDTOs;

namespace ServisTakipApi.Services
{
    public interface IMapService
    {
        Task<List<CoordinateDto>> GetRoutePolylineAsync(List<CoordinateDto> stops);
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

        public async Task<List<CoordinateDto>> GetRoutePolylineAsync(List<CoordinateDto> stops)
        {
            try
            {
                var apiKey = _configuration["ORS_API_KEY"];
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    Console.WriteLine("❌ [MapService] appsettings.json dosyasında 'ORS_API_KEY' bulunamadı!");
                    return new List<CoordinateDto>();
                }

                if (stops == null || stops.Count < 2)
                {
                    Console.WriteLine("⚠️ [MapService] Rota çizimi için en az 2 durak noktası gereklidir.");
                    return new List<CoordinateDto>();
                }

                const string url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

                var coordinates = stops.Select(s => new[] { s.Longitude, s.Latitude }).ToArray();
                var radiuses = stops.Select(_ => -1).ToArray(); // Noktaları en yakın yola bağlar

                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                
                // FormatException hatasını önlemek için TryAddWithoutValidation kullanılır
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
                    Console.WriteLine($"❌ [ORS API Hatası] Status: {response.StatusCode} | Detay: {responseBody}");
                    return new List<CoordinateDto>();
                }

                using var doc = JsonDocument.Parse(responseBody);
                var features = doc.RootElement.GetProperty("features");
                if (features.GetArrayLength() == 0) return new List<CoordinateDto>();

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
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [MapService Hatası]: {ex.Message}");
                return new List<CoordinateDto>();
            }
        }
    }
}