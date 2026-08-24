using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Models;

namespace ServisTakipApi.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Models.Route> Routes { get; set; }
        public DbSet<RouteStop> RouteStops { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ARAÇ VE ROTA KISITLAMALARI (Fluent API)

            // Araç -> Firma İlişkisi
            modelBuilder.Entity<Vehicle>()
                .HasOne(v => v.Company)
                .WithMany()
                .HasForeignKey(v => v.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            // Rota -> Firma, Araç ve Şoför İlişkileri
            modelBuilder.Entity<Models.Route>()
                .HasOne(r => r.Company)
                .WithMany()
                .HasForeignKey(r => r.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.Route>()
                .HasOne(r => r.Vehicle)
                .WithMany()
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Models.Route>()
                .HasOne(r => r.Driver)
                .WithMany()
                .HasForeignKey(r => r.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            // RouteStop -> Rota İlişkisi (Rota silinirse duraklar kazara silinmesin)
            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.Stops)
                .HasForeignKey(rs => rs.RouteId)
                .OnDelete(DeleteBehavior.Restrict);

            // RouteStop -> Yolcu (User) İlişkisi (Yolcu silinirse/pasife alınırsa durak kaydı uçmasın)
            modelBuilder.Entity<RouteStop>()
                .HasOne(rs => rs.Passenger)
                .WithMany()
                .HasForeignKey(rs => rs.PassengerId)
                .OnDelete(DeleteBehavior.Restrict);

            // RouteCode kolonunu benzersiz (Unique) hale getiriyoruz
            modelBuilder.Entity<Models.Route>()
                .HasIndex(r => r.RouteCode)
                .IsUnique();


            // Şirket ve Kullanıcı İlişkisi
            modelBuilder.Entity<User>()
                .HasOne(u => u.Company)
                .WithMany(c => c.Users)
                .HasForeignKey(u => u.CompanyId)
                .OnDelete(DeleteBehavior.SetNull); // Şirket silinirse, kullanıcının şirket IDsini NULL yap.

            // User ile Driver arasındaki Bire-Bir (One-to-One) ilişki
            modelBuilder.Entity<User>()
                .HasOne(u => u.DriverProfile)
                .WithOne(d => d.User)
                .HasForeignKey<Driver>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Kullanıcı silinirse, sürücü profili de silinsin.    

            modelBuilder.Entity<Vehicle>()
                .HasIndex(v => new { v.CompanyId, v.PlateNumber })
                .IsUnique()
                .HasFilter("\"Deleted\" = false");

            // Bir aracı vardiyalı olarak birden fazla sürücü kullanabilir
            modelBuilder.Entity<Driver>()
                .HasOne(d => d.Vehicle)
                .WithMany(v => v.Drivers)
                .HasForeignKey(d => d.VehicleId)
                .OnDelete(DeleteBehavior.SetNull); // Araç silinirse, sürücünün atamasını boşa (NULL) çıkar
        }
    }
}