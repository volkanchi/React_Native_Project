using Microsoft.AspNetCore.Mvc;
using ServisTakipApi.Context;
using ServisTakipApi.Models;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.Repositories;
using ServisTakipApi.Mappers;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Helpers;
using System;
using System.Linq;
using ServisTakipApi.Interfaces;


namespace ServisTakipApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto)
        {
            if(!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var response = await _userRepository.UserRegisterAsync(registerDto);
                return Ok(response);
            }
            catch(Exception ex)
            {
                return BadRequest(Response<User>.Fail(ex.Message));
            }
        }
        }
    }
