using System.ComponentModel.DataAnnotations;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    // kordinat verisi
    public class CoordinateDto
    {
        [Range(-90, 90)]
        public double Latitude { get; set; }  // Enlem (Y)

        [Range(-180, 180)]
        public double Longitude { get; set; } // Boylam (X)
    }
}