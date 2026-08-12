using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Models;

// AppDbContext sınıfımız, EF Core'un 'DbContext' sınıfından miras alıyor. Bu sayede hazır veritabanı fonksiyonlarına (kaydet, sil, güncelle) sahip oluyoruz. 
namespace ServisTakipApi.Context
{
 public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
    }   
}