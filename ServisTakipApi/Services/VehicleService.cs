using ServisTakipApi.DTOs.VehicleDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.Repositories;

namespace ServisTakipApi.Services
{
    public class VehicleService : IVehicleService
    {
        private readonly IVehicleRepository _repository;

        public VehicleService(IVehicleRepository repository)
        {
            _repository = repository;
        }

        public async Task<Response<VehicleResponseDto>> CreateVehicleAsync(CreateVehicleDto dto, Guid companyId)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.PlateNumber) ||
                string.IsNullOrWhiteSpace(dto.BrandAndModel) || dto.SeatingCapacity < 1)
                return Response<VehicleResponseDto>.Fail("Araç bilgileri geçersiz.");

            var plateNumber = dto.PlateNumber.Trim().ToUpperInvariant();
            if (await _repository.PlateExistsAsync(plateNumber, companyId))
                return Response<VehicleResponseDto>.Fail("Bu plakaya sahip aktif bir araç zaten kayıtlı.");

            var vehicle = new Models.Vehicle
            {
                PlateNumber = plateNumber,
                BrandAndModel = dto.BrandAndModel.Trim(),
                Capacity = dto.SeatingCapacity,
                CompanyId = companyId
            };

            await _repository.AddAsync(vehicle);
            await _repository.SaveChangesAsync();
            return Response<VehicleResponseDto>.Successful("Araç başarıyla oluşturuldu.", new VehicleResponseDto
            {
                Id = vehicle.Id,
                PlateNumber = vehicle.PlateNumber,
                BrandAndModel = vehicle.BrandAndModel,
                Capacity = vehicle.Capacity,
                CompanyId = vehicle.CompanyId,
                CreateDate = vehicle.CreateDate
            });
        }

        public async Task<Response<IEnumerable<VehicleResponseDto>>> GetVehiclesByCompanyAsync(Guid companyId)
        {
            var vehicles = await _repository.GetVehiclesByCompanyIdAsync(companyId);
            
            return Response<IEnumerable<VehicleResponseDto>>.Successful(vehicles.Select(v => new VehicleResponseDto
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                BrandAndModel = v.BrandAndModel,
                Capacity = v.Capacity,
                CompanyId = v.CompanyId,
                CreateDate = v.CreateDate
            }).ToList());
        }

        public async Task<Response<bool>> AssignDriverAsync(AssignVehicleToDriverDto dto, Guid companyId)
        {
            if (dto == null || dto.DriverId == Guid.Empty || dto.VehicleId == Guid.Empty)
                return Response<bool>.Fail("Sürücü ve araç bilgileri zorunludur.");

            var assigned = await _repository.AssignDriverAsync(dto.DriverId, dto.VehicleId, companyId);
            if (!assigned)
                return Response<bool>.Fail("Sürücü veya araç bulunamadı, firmaya ait değil ya da pasif durumda.");

            await _repository.SaveChangesAsync();
            return Response<bool>.Successful("Sürücü araca atandı.", true);
        }

        public async Task<Response<bool>> DeleteVehicleAsync(Guid vehicleId, Guid companyId)
        {
            if (vehicleId == Guid.Empty)
                return Response<bool>.Fail("Araç kimliği geçersiz.");

            var vehicle = await _repository.DeleteAsync(vehicleId, companyId);
            if (vehicle == null)
                return Response<bool>.Fail("Silinecek araç bulunamadı.");

            await _repository.SaveChangesAsync();
            return Response<bool>.Successful("Araç başarıyla silindi.", true);
        }
    }
}