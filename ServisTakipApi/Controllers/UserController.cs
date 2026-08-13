using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;

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
            if(!ModelState.IsValid) return BadRequest(ModelState);
            
            try
            {
                var response = await _userService.RegisterUserAsync(registerDto);
                
                // Response nesnesindeki Success değişkenine bakarak durumu belirliyoruz
                if (response.Success)
                    return Ok(response);
                    
                return BadRequest(response);
            }
            catch(Exception ex)
            {
                return BadRequest(Response<User>.Fail(ex.Message));
            }
        }
    }
}