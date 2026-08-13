using System;
using System.Collections.Generic;

namespace ServisTakipApi.Models
{
    public class Company
    {
        public Guid Id { get; set; }
        public required string CompanyName { get; set; }
        public required string Username { get; set; }
        public string? PasswordHash { get; set; }
        public string? PhoneNumber { get; set; }
        public required string Email { get; set; }
        public string? TaxNumber { get; set; } 
        public string? Address { get; set; }
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;
        public bool Deleted { get; set; } = false;
        public ICollection<User>? Users { get; set; } 
    }
}