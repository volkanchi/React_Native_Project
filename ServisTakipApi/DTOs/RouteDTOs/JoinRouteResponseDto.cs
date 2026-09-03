using System;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class JoinRouteResponseDto
    {
        public Guid RouteId { get; set; }
        public double? WalkingDistanceMeters { get; set; }
        public CoordinateDto? SnapCoordinate { get; set; }
        public bool RequiresWalkingNotice { get; set; }
    }
}