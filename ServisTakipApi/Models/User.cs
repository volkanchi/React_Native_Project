using System;

namespace ServisTakipApi.Models
{
    public class User
    {
        // KİMLİK VE PROFİL BİLGİLERİ
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        // GÜVENLİK VE YETKİ
        public string? PasswordHash { get; set; } 
        public UserRole Role { get; set; } 

        // LOGLAMA VE SİSTEM TAKİBİ (AUDIT) 
        public Guid? CreateUser { get; set; }
        public DateTime? CreateDate { get; set; }
        
        public Guid? UpdateUser { get; set; }
        public DateTime? UpdateDate { get; set; }
        
        public Guid? DeleteUser { get; set; }
        public DateTime? DeleteDate { get; set; }
        // Soft Delete 
        public bool Deleted { get; set; } = false; 
    }
}