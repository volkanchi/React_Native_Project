using ServisTakipApi.Models;

namespace ServisTakipApi.DTOs.UserDTOs

// Bu sınıf sadece dışarıdan gelen kayıt isteklerini (request) karşılamak içindir.
// İçinde ID veya Oluşturulma Tarihi gibi kullanıcının doldurmayacağı bilgiler yer almaz.
// Data Transfer Object (DTO) - Veri Transfer Nesnesi
{
    public class UserRegisterDto
    {
        public required string Name { get; set; }
        public required string Surname { get; set; }
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }
        public UserRole Role { get; set; }   
    }

}