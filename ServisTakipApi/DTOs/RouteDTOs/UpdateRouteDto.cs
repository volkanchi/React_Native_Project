using System;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class UpdateRouteDto
    {
        public required string Name { get; set; }
        public Guid VehicleId { get; set; }
        public Guid DriverId { get; set; }
    }
}