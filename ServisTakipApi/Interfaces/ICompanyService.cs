using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ServisTakipApi.Interfaces
{
    public interface ICompanyService
    {
        Task<Response<Company>> RegisterCompanyAsync(CompanyCreateDto companyDto);
        Task<Response<Company>> UpdateCompanyAsync(Guid companyId, CompanyUpdateDto companyDto);
        Task<Response<DriverResponseDto>> CreateDriverAsync(DriverCreateDto driverDto, Guid companyId);
        Task<Response<DriverResponseDto>> UpdateDriverAsync(Guid driverId, Guid companyId, DriverUpdateDto updateDto);
        Task<Response<bool>> DeleteDriverAsync(Guid driverId, Guid companyId);
        Task<Response<IEnumerable<DriverResponseDto>>> GetDriversByCompanyAsync(Guid companyId);
    }
}
