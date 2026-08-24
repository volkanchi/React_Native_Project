using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IUserRepository
    {
        Task<bool> IsEmailExistsAsync(string email);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<User> AddUserAsync(User user);
        Task<Driver> AddDriverProfileAsync(Driver driver);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByIdAsync(Guid userId);
        Task<User> UpdateUserAsync(User user);
        Task<bool> SoftDeleteUserAsync(Guid userId, Guid? actionUserId); // actionUserId = Silen kişinin ID'si
        Task<Driver?> GetDriverProfileByIdAndCompanyIdAsync(Guid driverId, Guid companyId);
    }
}