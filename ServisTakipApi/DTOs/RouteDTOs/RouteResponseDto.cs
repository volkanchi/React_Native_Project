using System;
using System.Collections.Generic;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class RouteResponseDto
    {
        public Guid Id { get; set; }
        public required string RouteCode { get; set; }
        public required string Name { get; set; }
        public Guid CompanyId { get; set; }
        public Guid VehicleId { get; set; }
        public Guid DriverId { get; set; }
        public List<CoordinateDto> PathCoordinates { get; set; } = new();
        public List<RouteStopResponseDto> Stops { get; set; } = new();
    }

    public class RouteStopResponseDto
    {
        public Guid Id { get; set; }
        public int StopOrder { get; set; }
        public Guid PassengerId { get; set; }
        public required CoordinateDto Location { get; set; }
        public bool IsActive { get; set; }
    }
}