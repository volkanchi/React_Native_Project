using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace ServisTakipApi
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<ServiceGroup> ServiceGroups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<ServiceRun> ServiceRuns { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostGIS Coğrafi Konum Desteğini EF Core'a Tanımlıyoruz
            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<ServiceGroup>().ToTable("service_groups");
            modelBuilder.Entity<GroupMember>().ToTable("group_members");
            modelBuilder.Entity<ServiceRun>().ToTable("service_runs");
        }
    }

    // --- ENTITY MODELLERİ ---
    public class User
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "PASSENGER";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ServiceGroup
    {
        public Guid Id { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string InviteCode { get; set; } = string.Empty;
        public Guid? DriverId { get; set; }
        public string? DestinationName { get; set; }
        public Point? DestinationLocation { get; set; } // PostGIS Point (Lat/Lng)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class GroupMember
    {
        public Guid Id { get; set; }
        public Guid GroupId { get; set; }
        public Guid UserId { get; set; }
        public string? PickupPointName { get; set; }
        public Point PickupLocation { get; set; } = null!; // Yolcunun Durak Pini
        public bool IsActiveToday { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ServiceRun
    {
        public Guid Id { get; set; }
        public Guid GroupId { get; set; }
        public string Status { get; set; } = "PENDING";
        public Point? CurrentDriverLocation { get; set; } // Sürücünün Anlık Konumu
        public string? OptimizedRouteGeojson { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}