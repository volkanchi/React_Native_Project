namespace ServisTakipApi.DTOs.RouteDTOs
{
    public class UpdateStopLocationDto
    {
        public required CoordinateDto NewLocation { get; set; }
    }
}