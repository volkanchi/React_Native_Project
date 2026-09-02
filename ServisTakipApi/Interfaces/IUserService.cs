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
        Task<Response<User>> UpdateUserAsync(Guid userId, UserUpdateDto updateDto, Guid actionUserId);
        Task<Response<bool>> DeleteUserAsync(Guid userId, Guid actionUserId);
        Task<Response<User>> GetProfileAsync(Guid userId);
    }
}