using System;

namespace ServisTakipApi.Models
{
    public class Vehicle
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public required string PlateNumber { get; set; }
        public required string BrandAndModel { get; set; }
        public int Capacity { get; set; } // Aracın maksimum yolcu kapasitesi
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public bool Deleted { get; set; } = false;
        
        // Bu araç hangi firmaya ait İlişkisi
        public Guid CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}