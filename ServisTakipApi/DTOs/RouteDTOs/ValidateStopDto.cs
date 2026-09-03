namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class ValidateStopDto
    {
        public required string RouteCode { get; set; }
        public required CoordinateDto Location { get; set; }
    }
}