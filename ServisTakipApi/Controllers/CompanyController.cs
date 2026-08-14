using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Firma")]
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
                    return Unauthorized(Response<User>.Fail("Firma kimlik bilgisi doğrulanamadı. Lütfen tekrar giriş yapın."));
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
                return BadRequest(Response<User>.Fail(ex.Message));
            }
        }
    }
}

