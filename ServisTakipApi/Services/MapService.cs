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
            if (string.IsNullOrWhiteSpace(_apiKey) || stops == null || stops.Count < 2)
            {
                return new List<CoordinateDto>();
            }

            const string url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

            // ORS sıralaması: [Boylam (Lng), Enlem (Lat)]
            var coordinates = stops.Select(s => new[] { s.Longitude, s.Latitude }).ToArray();

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Authorization", _apiKey);
            request.Headers.Add("Accept", "application/json, application/geo+json");
            request.Content = JsonContent.Create(new { coordinates });

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return new List<CoordinateDto>();
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(stream);

            var features = doc.RootElement.GetProperty("features");
            if (features.GetArrayLength() == 0)
            {
                return new List<CoordinateDto>();
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

            return result;
        }
    }
}