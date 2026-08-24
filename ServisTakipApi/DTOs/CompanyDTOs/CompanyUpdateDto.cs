using System.ComponentModel.DataAnnotations;

namespace ServisTakipApi.DTOs.CompanyDTOs
{
    public class CompanyUpdateDto
    {
        [Required, StringLength(200, MinimumLength = 2)]
        public required string CompanyName { get; set; }

        [Required, StringLength(500, MinimumLength = 5)]
        public required string Address { get; set; }

        [Required, Phone]
        public required string PhoneNumber { get; set; }

        [Required, EmailAddress]
        public required string Email { get; set; }

        [Required, StringLength(50, MinimumLength = 3)]
        public required string Username { get; set; }

        public string? TaxNumber { get; set; }
    }
}