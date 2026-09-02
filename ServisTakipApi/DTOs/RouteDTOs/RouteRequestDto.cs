namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class RouteRequestDto
    {
        public List<CoordinateDto> Stops { get; set; } = new();
    }
}