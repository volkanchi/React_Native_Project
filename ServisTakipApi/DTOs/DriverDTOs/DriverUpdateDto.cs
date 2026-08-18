using System.ComponentModel.DataAnnotations;

namespace ServisTakipApi.DTOs.DriverDTOs
{
    public class DriverUpdateDto
    {
        [Required(ErrorMessage = "Ad gereklidir.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Ad 2-100 karakter arasında olmalıdır.")]
        public required string Name { get; set; }

        [Required(ErrorMessage = "Soyad gereklidir.")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "Soyad 2-100 karakter arasında olmalıdır.")]
        public required string Surname { get; set; }

        [Required(ErrorMessage = "Telefon numarası gereklidir.")]
        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz.")]
        public required string PhoneNumber { get; set; }
    }
}