namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class JoinRouteDto
    {
        public required string RouteCode { get; set; } // Örn: 34ABC123-8472
        public required CoordinateDto Location { get; set; } // Yolcunun haritada seçtiği pin
    }
}