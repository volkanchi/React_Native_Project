namespace ServisTakipApi.DTOs.VehicleDTOs
{
    using System.ComponentModel.DataAnnotations;

    public class CreateVehicleDto
    {
        [Required]
        [StringLength(20)]
        public string PlateNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string BrandAndModel { get; set; }  = string.Empty;

        [Range(1, 200)]
        public int SeatingCapacity { get; set; }
    }
}