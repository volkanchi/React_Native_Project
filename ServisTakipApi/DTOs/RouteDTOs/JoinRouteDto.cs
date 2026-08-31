namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class JoinRouteDto
    {
        public string RouteCode { get; set; } = string.Empty;
        public CoordinateDto Location { get; set; } = new CoordinateDto(); 
    }
}