using System;

namespace ServisTakipApi.Models
{
    public class Driver
    {
        public Guid Id { get; set; }

        // User tablosu ile bire-bir bağlantı
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        // Sürücüye Özel Alanlar
        public string PlateNumber { get; set; } = string.Empty;
        public string? BrandAndModel { get; set; }
        public int Capacity { get; set; }
        public Guid? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        // Aktif olarak serviste mi?
        public bool IsActiveDuty { get; set; } = false;

    }
}