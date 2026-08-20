using NetTopologySuite.Geometries;
using System;

namespace ServisTakipApi.Models
{
    public class RouteStop
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // PostGIS'in anlayacağı coğrafi nokta (Enlem/Boylam)
        public required Point Location { get; set; } 
        
        public int StopOrder { get; set; } // Şoförün uğrama sırası (1. Durak, 2. Durak vb.)
        
        // Yolcu akşamdan "Yarın yokum" derse bu false olacak ve araç buraya uğramayacak
        public bool IsActive { get; set; } = true; 

        // Rota ilişkisi
        public Guid RouteId { get; set; }
        public Route? Route { get; set; }

        // Yolcu ilişkisi
        public Guid PassengerId { get; set; } 
        public User? Passenger { get; set; }
    }
}