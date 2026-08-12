using ServisTakipApi.Models;
using ServisTakipApi.DTOs.UserDTOs;
namespace ServisTakipApi.Mappers
{
    public static class UserMapper
    {
        public static User ToUserModel(this UserRegisterDto registerDto,string hashedPassword)
        {
            return new User
            {
                Id = Guid.NewGuid(),
                Name = registerDto.Name,
                Surname = registerDto.Surname,
                Username = registerDto.Username,
                Email = registerDto.Email,
                PhoneNumber = registerDto.PhoneNumber,
                Role = registerDto.Role,
                CreateDate = DateTime.UtcNow,
                PasswordHash = hashedPassword

            };
        }
        public static UserDto ToUserDto(this User user)
        {
            return new UserDto
            {
                Name = user.Name,
                Surname = user.Surname,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}