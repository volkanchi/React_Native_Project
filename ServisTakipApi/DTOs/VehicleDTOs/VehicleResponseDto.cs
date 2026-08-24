namespace ServisTakipApi.DTOs.VehicleDTOs
{
    public class VehicleResponseDto
    {
        public Guid Id { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public string BrandAndModel { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public Guid CompanyId { get; set; }
        public DateTime CreateDate { get; set; }
    }
}