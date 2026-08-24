using ServisTakipApi.DTOs;
using ServisTakipApi.DTOs.VehicleDTOs;
using ServisTakipApi.Models;

namespace ServisTakipApi.Mappings
{
    public static class VehicleMappingExtensions
    {
        public static Vehicle ToEntity(this CreateVehicleDto dto, Guid companyId)
        {
            if (dto == null) return null!;

            return new Vehicle
            {
                PlateNumber = dto.PlateNumber,
                BrandAndModel = dto.BrandAndModel,
                Capacity = dto.SeatingCapacity,
                CompanyId = companyId
            };
        }
    }
}