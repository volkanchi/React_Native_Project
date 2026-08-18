using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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
    }
}