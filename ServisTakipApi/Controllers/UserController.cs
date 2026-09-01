using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Collections.Generic;

namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response = await _userService.RegisterUserAsync(registerDto);

                // Response nesnesindeki Success değişkenine bakarak durumu belirliyoruz
                if (response.Success)
                    return Ok(response);

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<User>.Fail(ex.Message));
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response = await _userService.LoginUserAsync(loginDto);

                if (response.Success)
                    return Ok(response); // 200 OK ile token'ı döner

                return BadRequest(response); // 400 Bad Request
            }
            catch (Exception ex)
            {
                return BadRequest(Response<string>.Fail(ex.Message));
            }
        }

        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserUpdateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                // Token'dan istek atan kişinin ID'sini çekiyoruz
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

                Guid userId = Guid.Parse(userIdClaim);

                // Kendi profilini güncellediği için actionUserId de kendisi (userId) oluyor
                var response = await _userService.UpdateUserAsync(userId, updateDto, userId);

                if (response.Success) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<User>.Fail(ex.Message));
            }
        }

        [Authorize]
        [HttpDelete("delete-profile")]
        public async Task<IActionResult> DeleteProfile()
        {
            try
            {
                // Token'dan ID'yi çekiyoruz
                var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

                Guid userId = Guid.Parse(userIdClaim);

                var response = await _userService.DeleteUserAsync(userId, userId);

                if (response.Success) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return BadRequest(Response<bool>.Fail(ex.Message));
            }
        }
        [HttpGet("my-profile")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(Response<string>.Fail("Oturum geçersiz."));

            var result = await _userService.GetProfileAsync(Guid.Parse(userIdClaim));
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // ===== DRIVER ENDPOINTS =====

        [HttpGet("drivers/{driverId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> GetDriver(Guid driverId)
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var response = await _userService.GetDriverByIdAsync(driverId, companyId.Value);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpGet("drivers")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> GetCompanyDrivers()
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var response = await _userService.GetCompanyDriversAsync(companyId.Value);
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPut("drivers/{driverId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> UpdateDriver(Guid driverId, [FromBody] DriverUpdateDto updateDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(Response<string>.Fail("Kullanıcı kimliği doğrulanamadı."));

            var response = await _userService.UpdateDriverAsync(driverId, companyId.Value, updateDto, Guid.Parse(userIdClaim));
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("drivers/{driverId:guid}")]
        [Authorize(Roles = "Firma")]
        public async Task<IActionResult> DeleteDriver(Guid driverId)
        {
            var companyId = GetCompanyId();
            if (companyId == null)
                return Unauthorized(Response<string>.Fail("Firma kimliği doğrulanamadı."));

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(Response<string>.Fail("Kullanıcı kimliği doğrulanamadı."));

            var response = await _userService.DeleteDriverAsync(driverId, companyId.Value, Guid.Parse(userIdClaim));
            return response.Success ? Ok(response) : BadRequest(response);
        }

        private Guid? GetCompanyId()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            return Guid.TryParse(companyIdClaim, out var companyId) ? companyId : null;
        }
    }
}