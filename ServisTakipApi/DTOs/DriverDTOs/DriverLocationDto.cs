namespace ServisTakipApi.DTOs.DriverDTOs
{
    public class DriverLocationDto
    {
        public Guid RouteId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Speed { get; set; }
        public double? Heading { get; set; } 
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}