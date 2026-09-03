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
        private readonly string? _apiKey;

        public MapService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["ORS_API_KEY"];
        }

        public async Task<List<CoordinateDto>> GetRoutePolylineAsync(List<CoordinateDto> stops)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                Console.WriteLine("❌ HATA: appsettings.json dosyasında 'ORS_API_KEY' bulunamadı!");
                return new List<CoordinateDto>();
            }

            if (stops == null || stops.Count < 2)
            {
                Console.WriteLine("⚠️ UYARI: Rota çizimi için en az 2 durak gereklidir.");
                return new List<CoordinateDto>();
            }

            const string url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

            // ORS sıralaması: [Boylam (Lng), Enlem (Lat)]
            var coordinates = stops.Select(s => new[] { s.Longitude, s.Latitude }).ToArray();
            // Tüm noktaları en yakın yola zorla bağlamak için -1 verilir
            var radiuses = stops.Select(_ => -1).ToArray();

            var requestBody = new
            {
                coordinates = coordinates,
                radiuses = radiuses
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Authorization", _apiKey);
            request.Headers.Add("Accept", "application/json, application/geo+json");
            request.Content = JsonContent.Create(requestBody);

            var response = await _httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"❌ ORS API Hatası! Status: {response.StatusCode}, Detay: {responseContent}");
                return new List<CoordinateDto>();
            }

            using var doc = JsonDocument.Parse(responseContent);
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

            Console.WriteLine($"✅ Rota başarıyla hesaplandı. Toplam nokta sayısı: {result.Count}");
            return result;
        }
    }
}