using ServisTakipApi.DTOs.VehicleDTOs;
using ServisTakipApi.DTOs.Response;

namespace ServisTakipApi.Services
{
    public interface IVehicleService
    {
        Task<Response<VehicleResponseDto>> CreateVehicleAsync(CreateVehicleDto createVehicleDto, Guid companyId);
        Task<Response<IEnumerable<VehicleResponseDto>>> GetVehiclesByCompanyAsync(Guid companyId);
        Task<Response<bool>> AssignDriverAsync(AssignVehicleToDriverDto dto, Guid companyId);
        Task<Response<bool>> DeleteVehicleAsync(Guid vehicleId, Guid companyId);
    }
}