using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Firma,Admin")]
    public class CompanyController : ControllerBase
    {
        private readonly ICompanyService _companyService;

        public CompanyController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterCompany([FromBody] CompanyCreateDto companyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var response = await _companyService.RegisterCompanyAsync(companyDto);

                if (response.Success)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<Company>.Fail(ex.Message));
            }
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateCompany([FromBody] CompanyUpdateDto companyDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Token'daki CompanyId claim'ini oku, yoksa User ID üzerinden kompanse et
            var companyIdClaim = User.FindFirst("CompanyId")?.Value 
                                 ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(companyIdClaim) || !Guid.TryParse(companyIdClaim, out var companyId))
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var response = await _companyService.UpdateCompanyAsync(companyId, companyDto);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPost("add-driver")]
        public async Task<IActionResult> AddDriver([FromBody] DriverCreateDto driverDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                // Gelen kullanıcının (User) Token'ındaki (Claims) CompanyId'yi buluyoruz
                var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "CompanyId")?.Value;

                if (string.IsNullOrEmpty(companyIdClaim))
                {
                    // Eğer token'ın içinde bu bilgi yoksa, bu hesap hatalı bir Firma hesabıdır
                    return Unauthorized(Response<DriverResponseDto>.Fail("Firma kimlik bilgisi doğrulanamadı. Lütfen tekrar giriş yapın."));
                }

                // Metin (string) olarak gelen ID'yi Guid formatına çeviriyoruz
                Guid companyId = Guid.Parse(companyIdClaim);

                // DTO'yu ve güvenli bir şekilde elde ettiğimiz CompanyId'yi Service'e gönderiyoruz
                var response = await _companyService.CreateDriverAsync(driverDto, companyId);

                if (response.Success)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<DriverResponseDto>.Fail(ex.Message));
            }
        }
        [HttpPut("update-driver/{driverId}")]
        public async Task<IActionResult> UpdateDriver(Guid driverId, [FromBody] DriverUpdateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                // 1. Token'dan bu işlemi yapmaya çalışan Firmanın ID'sini çekiyoruz
                var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "CompanyId")?.Value;

                if (string.IsNullOrEmpty(companyIdClaim))
                    return Unauthorized(Response<DriverResponseDto>.Fail("Firma kimlik bilgisi doğrulanamadı. Lütfen tekrar giriş yapın."));

                Guid companyId = Guid.Parse(companyIdClaim);

                // 2. Güncelleme işlemini Service katmanına devrediyoruz
                var response = await _companyService.UpdateDriverAsync(driverId, companyId, updateDto);

                if (response.Success)
                    return Ok(response);

                return BadRequest(response); // Hata varsa (örn: şoför bu firmaya ait değilse) 400 döner
            }
            catch (Exception ex)
            {
                return BadRequest(Response<DriverResponseDto>.Fail(ex.Message));
            }
        }

        [HttpGet("drivers")]
        public async Task<IActionResult> GetDrivers()
        {
            var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "CompanyId")?.Value;
            if (string.IsNullOrEmpty(companyIdClaim))
                return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı. Lütfen tekrar giriş yapın."));

            Guid companyId = Guid.Parse(companyIdClaim);
            var response = await _companyService.GetDriversByCompanyAsync(companyId);
            return Ok(response);
        }

        [HttpDelete("delete-driver/{driverId}")]
        public async Task<IActionResult> DeleteDriver(Guid driverId)
        {
            try
            {
                // 1. Token'dan Firmanın ID'sini çekiyoruz
                var companyIdClaim = User.Claims.FirstOrDefault(c => c.Type == "CompanyId")?.Value;

                if (string.IsNullOrEmpty(companyIdClaim))
                    return Unauthorized(Response<bool>.Fail("Firma kimlik bilgisi doğrulanamadı. Lütfen tekrar giriş yapın."));

                Guid companyId = Guid.Parse(companyIdClaim);

                // 2. Silme (Soft Delete) işlemini Service katmanına devrediyoruz
                var response = await _companyService.DeleteDriverAsync(driverId, companyId);

                if (response.Success)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<bool>.Fail(ex.Message));
            }
        }
    }
}

