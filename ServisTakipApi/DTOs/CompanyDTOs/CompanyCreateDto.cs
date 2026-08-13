using System.ComponentModel.DataAnnotations;

namespace ServisTakipApi.DTOs.CompanyDTOs
{
    public class CompanyCreateDto
    {
        [Required(ErrorMessage = "Şirket adı gereklidir.")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "Şirket adı 2-200 karakter arasında olmalıdır.")]
        public required string CompanyName { get; set; }

        [Required(ErrorMessage = "Adres gereklidir.")]
        [StringLength(500, MinimumLength = 5, ErrorMessage = "Adres 5-500 karakter arasında olmalıdır.")]
        public required string Address { get; set; }

        [Required(ErrorMessage = "Telefon numarası gereklidir.")]
        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz.")]
        public required string PhoneNumber { get; set; }

        [Required(ErrorMessage = "Email gereklidir.")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Kullanıcı adı gereklidir.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Kullanıcı adı 3-50 karakter arasında olmalıdır.")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Şifre gereklidir.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır.")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$", ErrorMessage = "Şifre büyük harf, küçük harf, rakam ve özel karakter içermelidir.")]
        public required string Password { get; set; }
    }
}