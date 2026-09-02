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
            // Token'daki CompanyId claim'ini oku, yoksa User ID üzerinden kompanse et
            var companyIdClaim = User.FindFirst("CompanyId")?.Value 
                                 ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Guid.TryParse(companyIdClaim, out var companyId) ? companyId : null;
        }

        [HttpGet]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> GetCompanyRoutes()
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var result = await _routeService.GetRoutesByCompanyAsync(companyId.Value);
            return Ok(result);
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
    }
}