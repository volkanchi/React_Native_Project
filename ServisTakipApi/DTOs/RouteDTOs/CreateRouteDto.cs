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
        
        // Tüm yolun çizimi için gereken koordinat listesi
        public required List<CoordinateDto> PathCoordinates { get; set; } 
        
        // Güzergah üzerindeki duraklar
        public required List<CreateRouteStopDto> Stops { get; set; }
    }
}