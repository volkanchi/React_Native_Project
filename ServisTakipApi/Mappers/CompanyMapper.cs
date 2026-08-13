using ServisTakipApi.Models;
using ServisTakipApi.DTOs.CompanyDTOs;
namespace ServisTakipApi.Mappers
{
    public static class CompanyMapper
    {
        public static (Company company, User user) ToCompanyAndUserModel(this CompanyCreateDto companyDto, string hashedPassword)
        {
            var newCompanyId = Guid.NewGuid(); // ortak id 

            var company = new Company
            {
                Id = newCompanyId,
                CompanyName = companyDto.CompanyName,
                Address = companyDto.Address,
                PhoneNumber = companyDto.PhoneNumber,
                Email = companyDto.Email,
                Username = companyDto.Username,
                PasswordHash = hashedPassword,
                CreateDate = DateTime.UtcNow,
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                CompanyId = newCompanyId, // kullanici sirket ile iliskilendiriyor yonetici ve sofor olarak
                Name = companyDto.CompanyName,
                Email = companyDto.Email,
                PhoneNumber = companyDto.PhoneNumber,
                Username = companyDto.Username,
                PasswordHash = hashedPassword,
                CreateDate = DateTime.UtcNow,
                Role = UserRole.Firma
            };

            return (company, user);
        }
    }
}
