using ServisTakipApi.Models;

namespace ServisTakipApi.DTOs.UserDTOs
{
    // Admin panelinde kullanıcı listesi için hafif bir görünüm (parola bilgisi içermez)
    public class AdminUserResponseDto
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public UserRole Role { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime? CreateDate { get; set; }
    }
}
