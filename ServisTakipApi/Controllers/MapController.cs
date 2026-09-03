using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Services;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MapController : ControllerBase
    {
        private readonly IMapService _mapService;

        public MapController(IMapService mapService)
        {
            _mapService = mapService;
        }

        [HttpPost("route")]
        public async Task<IActionResult> GetRoute([FromBody] RouteRequestDto request)
        {
            try
            {
                if (request?.Stops == null || request.Stops.Count < 2)
                {
                    return BadRequest(new { success = false, message = "En az 2 durak noktası gereklidir." });
                }

                var result = await _mapService.GetRoutePolylineAsync(request.Stops);
                if (result.Coordinates.Count == 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Güzergah hesaplanamadı: {result.ErrorDetail ?? "Bilinmeyen hata"}"
                    });
                }

                return Ok(new { success = true, data = result.Coordinates });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [MapController Hatası]: {ex}");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}