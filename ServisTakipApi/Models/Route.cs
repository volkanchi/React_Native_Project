using System;

namespace ServisTakipApi.Models
{
    public class Route
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public required string Name { get; set; } // Güzergah Adı
        public required string StartLocation { get; set; } 
        public required string EndLocation { get; set; } 
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
    }
}