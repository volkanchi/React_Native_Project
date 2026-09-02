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
            if (request?.Stops == null || request.Stops.Count < 2)
            {
                return BadRequest(new { success = false, message = "En az 2 durak noktası gereklidir." });
            }

            var polyline = await _mapService.GetRoutePolylineAsync(request.Stops);
            if (polyline.Count == 0)
            {
                return BadRequest(new { success = false, message = "Güzergah hesaplanamadı." });
            }

            return Ok(new { success = true, data = polyline });
        }
    }
}