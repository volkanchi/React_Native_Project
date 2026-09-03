using System;
using System.Collections.Generic;

// genel rota paketi

namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class CreateRouteDto
    {
        public required string Name { get; set; }
        public Guid VehicleId { get; set; }
        public Guid DriverId { get; set; }
        public required List<CoordinateDto> PathCoordinates { get; set; }
    }
}