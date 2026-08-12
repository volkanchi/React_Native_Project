using ServisTakipApi.Models;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.Response;
namespace ServisTakipApi.Interfaces
{
    public interface IUserRepository
    {
        public Task<Response<User>> UserRegisterAsync(UserRegisterDto registerUserDto);
    }
}