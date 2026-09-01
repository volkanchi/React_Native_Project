using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RouteController : ControllerBase
    {
        private readonly IRouteService _routeService;

        public RouteController(IRouteService routeService)
        {
            _routeService = routeService;
        }


        [HttpPost("create")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> CreateRoute([FromBody] CreateRouteDto createDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var response = await _routeService.CreateRouteAsync(companyId.Value, createDto);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPut("{routeId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> UpdateRoute(Guid routeId, [FromBody] UpdateRouteDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var response = await _routeService.UpdateRouteAsync(routeId, companyId.Value, updateDto);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("{routeId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> DeleteRoute(Guid routeId)
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var response = await _routeService.DeleteRouteAsync(routeId, companyId.Value);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        private Guid? GetCompanyId()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            return Guid.TryParse(companyIdClaim, out var companyId) ? companyId : null;
        }
        
        [HttpGet("driver-route")]
        [Authorize(Roles = "Sofor")]
        public async Task<IActionResult> GetDriverRoute()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(Response<string>.Fail("Kullanıcı kimliği doğrulanamadı."));

            var result = await _routeService.GetDriverActiveRouteAsync(Guid.Parse(userIdClaim));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // Firmanın Kendi Rotalarını Listelemesi
        [HttpGet("company")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> GetCompanyRoutes()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            if (string.IsNullOrEmpty(companyIdClaim) || !Guid.TryParse(companyIdClaim, out var companyId))
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var response = await _routeService.GetRoutesByCompanyIdAsync(companyId);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpGet("{routeId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> GetRoute(Guid routeId)
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var response = await _routeService.GetRouteByIdAsync(routeId, companyId.Value);
            return response.Success ? Ok(response) : BadRequest(response);
        }
    }
}