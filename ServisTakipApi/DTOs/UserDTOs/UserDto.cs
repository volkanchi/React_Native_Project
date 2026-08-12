using System;
using ServisTakipApi.Models;

namespace ServisTakipApi.DTOs.UserDTOs
{
    public class UserDto
    {
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public UserRole Role { get; set; }
    }

}