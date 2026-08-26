using System;

namespace ServisTakipApi.DTOs.CompanyDTOs
{
    public class CompanyResponseDto
    {
        public Guid Id { get; set; }

        public string CompanyName { get; set; } = string.Empty!;

        public string Username { get; set; } = string.Empty!;

        public string Email { get; set; } = string.Empty!;

        public string? PhoneNumber { get; set; }

        public string? TaxNumber { get; set; }

        public string? Address { get; set; }

        public DateTime CreateDate { get; set; }
    }
}
