namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class JoinRouteDto
    {
        public required string RouteCode { get; set; } 
        public required CoordinateDto Location { get; set; } 
    }
}