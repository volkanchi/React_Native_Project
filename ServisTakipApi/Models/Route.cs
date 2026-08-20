using System;
using NetTopologySuite.Geometries;

namespace ServisTakipApi.Models
{
    public class Route
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public required string Name { get; set; } // Güzergah Adı
        public LineString? RoutePath { get; set; } // rotanın çizilmiş polyline hali 
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public bool Deleted { get; set; } = false;

        // İlişki 1: Bu rota hangi firmanın operasyonu?
        public Guid CompanyId { get; set; } 
        public Company? Company { get; set; }

        // İlişki 2: Bu rotaya hangi araç tahsis edildi?
        public Guid VehicleId { get; set; } 
        public Vehicle? Vehicle { get; set; }

        // İlişki 3: Bu rotada Şoför kim? (User tablosundan bağlanıyor)
        public Guid DriverId { get; set; } 
        public User? Driver { get; set; }

        // İlişki 4: bire çok ilişki, bir rotanın birden fazla yolcusu olduğundan birden çok pin tutar 
        public ICollection<RouteStop> Stops { get; set; } = new List<RouteStop>();
    }
}