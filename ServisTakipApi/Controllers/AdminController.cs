using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ServisTakipApi.Controllers
{
    // Sistem genelindeki firma ve kullanıcı verilerine erişim yalnızca Admin rolüne açıktır.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly IUserService _userService;

        public AdminController(IAdminService adminService, IUserService userService)
        {
            _adminService = adminService;
            _userService = userService;
        }

        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies()
        {
            var result = await _adminService.GetAllCompaniesAsync();
            return Ok(result);
        }

        [HttpDelete("companies/{companyId}")]
        public async Task<IActionResult> DeleteCompany(Guid companyId)
        {
            var result = await _adminService.DeleteCompanyAsync(companyId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var result = await _adminService.GetAllUsersAsync();
            return Ok(result);
        }

        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(Guid userId)
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !Guid.TryParse(adminIdClaim, out var adminId))
                return Unauthorized(Response<bool>.Fail("Yönetici kimliği doğrulanamadı."));

            var result = await _userService.DeleteUserAsync(userId, adminId);
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}
