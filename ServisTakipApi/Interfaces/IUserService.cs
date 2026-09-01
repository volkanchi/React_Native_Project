using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
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
        Task<Response<DriverResponseDto>> GetDriverByIdAsync(Guid driverId, Guid companyId);
        Task<Response<List<DriverResponseDto>>> GetCompanyDriversAsync(Guid companyId);
        Task<Response<DriverResponseDto>> UpdateDriverAsync(Guid driverId, Guid companyId, DriverUpdateDto updateDto, Guid actionUserId);
        Task<Response<bool>> DeleteDriverAsync(Guid driverId, Guid companyId, Guid actionUserId);
    }
}