using System;
using System.ComponentModel.DataAnnotations;

namespace ServisTakipApi.DTOs.RouteDTOs
{
    // durak verisi
    public class CreateRouteStopDto
    {
        [Range(1, int.MaxValue)]
        public int StopOrder { get; set; }
        public Guid PassengerId { get; set; }
        public required CoordinateDto Location { get; set; }
    }
}