using System.ComponentModel.DataAnnotations;
using ServisTakipApi.Models;

namespace ServisTakipApi.DTOs.UserDTOs
{
    /// <summary>
    /// Bu sınıf sadece dışarıdan gelen kayıt isteklerini (request) karşılamak içindir.
    /// İçinde ID veya Oluşturulma Tarihi gibi kullanıcının doldurmayacağı bilgiler yer almaz.
    /// Data Transfer Object (DTO) - Veri Transfer Nesnesi
    /// </summary>
    public class UserRegisterDto
    {
        [Required(ErrorMessage = "Ad gereklidir.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Ad 2-100 karakter arasında olmalıdır.")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "Soyadı gereklidir.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Soyadı 2-100 karakter arasında olmalıdır.")]
        public required string Surname { get; set; }

        [Required(ErrorMessage = "Email gereklidir.")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Telefon numarası gereklidir.")]
        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz.")]
        [RegularExpression(@"^\+?\d{10}$", ErrorMessage = "Telefon numarası haneli olmalıdır ile başlayabilir.")]
        public required string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Kullanıcı adı gereklidir.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Kullanıcı adı 3-50 karakter arasında olmalıdır.")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Şifre gereklidir.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$", ErrorMessage = "Şifre büyük harf, küçük harf, rakam ve özel karakter içermelidir.")]
        public required string Password { get; set; }   
    }
}