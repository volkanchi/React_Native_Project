using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.RouteDTOs;
using ServisTakipApi.Interfaces;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Firma")]
    public class RouteController : ControllerBase
    {
        private readonly IRouteService _routeService;

        public RouteController(IRouteService routeService)
        {
            _routeService = routeService;
        }

        [Authorize]
        [HttpPost("create")]
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
    }
}