using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Interfaces;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Yolcu")]
    public class PassengerRouteController : ControllerBase
    {
        private readonly IRouteService _routeService;

        public PassengerRouteController(IRouteService routeService)
        {
            _routeService = routeService;
        }

        [HttpPost("join")]
        public async Task<IActionResult> JoinRoute([FromBody] JoinRouteDto joinDto)
        {
            if (!TryGetPassengerId(out var passengerId)) return Unauthorized();

            var response = await _routeService.JoinRouteAsync(passengerId, joinDto);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPut("update-location/{routeId}")]
        public async Task<IActionResult> UpdateLocation(Guid routeId, [FromBody] UpdateStopLocationDto updateDto)
        {
            if (!TryGetPassengerId(out var passengerId)) return Unauthorized();

            var response = await _routeService.UpdateStopLocationAsync(passengerId, routeId, updateDto);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("leave/{routeId}")]
        public async Task<IActionResult> LeaveRoute(Guid routeId)
        {
            if (!TryGetPassengerId(out var passengerId)) return Unauthorized();

            var response = await _routeService.LeaveRouteAsync(passengerId, routeId);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpGet("my-routes")]
        public async Task<IActionResult> GetMyRoutes()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(Response<string>.Fail("Kullanıcı kimliği doğrulanamadı."));

            var result = await _routeService.GetPassengerRoutesAsync(Guid.Parse(userIdClaim));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{routeId:guid}")]
        public async Task<IActionResult> GetRoute(Guid routeId)
        {
            if (!TryGetPassengerId(out var passengerId)) return Unauthorized();

            var result = await _routeService.GetPassengerRouteAsync(passengerId, routeId);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("preview/{routeCode}")]
        public async Task<IActionResult> PreviewRoute(string routeCode)
        {
            var result = await _routeService.PreviewRouteForJoinAsync(routeCode);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        private bool TryGetPassengerId(out Guid passengerId)
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(claim, out passengerId);
        }
    }
}