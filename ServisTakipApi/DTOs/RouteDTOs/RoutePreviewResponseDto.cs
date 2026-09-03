using System;
using System.Collections.Generic;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class RoutePreviewResponseDto
    {
        public Guid RouteId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RouteCode { get; set; } = string.Empty;
        public List<CoordinateDto> PathCoordinates { get; set; } = new();
        public List<ExistingStopDto> ExistingStops { get; set; } = new();
    }

    public class ExistingStopDto
    {
        public string Label { get; set; } = "Mevcut Durak";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}