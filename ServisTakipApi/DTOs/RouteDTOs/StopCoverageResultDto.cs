namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class StopCoverageResultDto
    {
        public bool IsWithinCoverage { get; set; }
        public double WalkingDistanceMeters { get; set; }
        public CoordinateDto? SnapCoordinate { get; set; }
        public bool RequiresWalkingNotice { get; set; }
    }
}