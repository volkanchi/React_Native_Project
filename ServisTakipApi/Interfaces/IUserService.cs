using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IUserService
    {
        Task<Response<User>> RegisterUserAsync(UserRegisterDto registerUserDto);
        Task<Response<string>> LoginUserAsync(UserLoginDto loginDto);
    }
}