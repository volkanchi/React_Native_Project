using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface ICompanyRepository
    {
        Task<bool> IsEmailExistsAsync(string email);
        Task<bool> IsUsernameExistsAsync(string username);
        Task<Company> AddCompanyAsync(Company company);
        Task<Company?> GetCompanyByIdAsync(Guid id);
        Task<Company?> GetCompanyByUsernameAsync(string username);
    }
}
