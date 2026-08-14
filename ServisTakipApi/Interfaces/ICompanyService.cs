using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface ICompanyService
    {
        Task<Response<Company>> RegisterCompanyAsync(CompanyCreateDto companyDto);
        Task<Response<User>> CreateDriverAsync(DriverCreateDto driverDto, Guid companyId);
    }
}
