using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.VehicleDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Services;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Firma")]
    public class VehiclesController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;

        public VehiclesController(IVehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }

        [HttpPost("add-vehicle")]
        public async Task<IActionResult> CreateVehicle([FromBody] CreateVehicleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var result = await _vehicleService.CreateVehicleAsync(dto, companyId.Value);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetByCompany()
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var result = await _vehicleService.GetVehiclesByCompanyAsync(companyId.Value);
            return Ok(result);
        }

        [HttpPut("assign-driver")]
        public async Task<IActionResult> AssignDriver([FromBody] AssignVehicleToDriverDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı."));

            var result = await _vehicleService.AssignDriverAsync(dto, companyId.Value);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        private Guid? GetCompanyId()
        {
            var claim = User.FindFirst("CompanyId")?.Value;
            return Guid.TryParse(claim, out var companyId) ? companyId : null;
        }
    }
}