namespace ServisTakipApi.DTOs.VehicleDTOs
{
    // Bir sürücüyü bir araca bağlarken kullanılacak
    public class AssignVehicleToDriverDto
    {
        public Guid DriverId { get; set; }
        public Guid VehicleId { get; set; }
    }
}