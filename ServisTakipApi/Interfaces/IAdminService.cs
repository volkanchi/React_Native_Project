using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.UserDTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface IAdminService
    {
        Task<Response<IEnumerable<CompanyResponseDto>>> GetAllCompaniesAsync();
        Task<Response<bool>> DeleteCompanyAsync(Guid companyId);
        Task<Response<IEnumerable<AdminUserResponseDto>>> GetAllUsersAsync();
    }
}
