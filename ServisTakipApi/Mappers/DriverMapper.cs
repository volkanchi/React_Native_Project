using ServisTakipApi.Models;
using ServisTakipApi.DTOs.DriverDTOs;
using System;

namespace ServisTakipApi.Mappers
{
    public static class DriverMapper
    {
        public static User MapToDriverUser(DriverCreateDto request, string hashedPassword, Guid companyId)
        {
            return new User
            {
                Id = Guid.NewGuid(),
                CreateDate = DateTime.UtcNow,
                Name = request.Name,
                Surname = request.Surname,
                Email = request.Email,
                Username = request.Username,
                PhoneNumber = request.PhoneNumber,
                PasswordHash = hashedPassword,
                // Token'dan gelen firmanın ID'si şoföre atanıyor
                CompanyId = companyId, 
                Role = UserRole.Sofor 
            };
        }
    }
}