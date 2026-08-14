using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IUserRepository
    {
        Task<bool> IsEmailExistsAsync(string email);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<User> AddUserAsync(User user);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
    }
}