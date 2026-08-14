using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.Helpers;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Mappers;
using ServisTakipApi.Models;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserRepository _userRepository;

        public CompanyService(ICompanyRepository companyRepository, IUserRepository userRepository)
        {
            _companyRepository = companyRepository;
            _userRepository = userRepository;
        }

        public async Task<Response<Company>> RegisterCompanyAsync(CompanyCreateDto companyDto)
        {
            try
            {
                if (await _companyRepository.IsEmailExistsAsync(companyDto.Email))
                {
                    return Response<Company>.Fail("Bu e-posta adresi zaten kullanılıyor.");
                }

                // Check if username exists in both company and user repositories
                if (await _companyRepository.IsUsernameExistsAsync(companyDto.Username))
                {
                    return Response<Company>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                if (await _userRepository.IsUsernameExistsAsync(companyDto.Username))
                {
                    return Response<Company>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                // Hash password
                var hashedPassword = PasswordHasher.HashPassword(companyDto.Password);

                // Map to models
                var (company, user) = companyDto.ToCompanyAndUserModel(hashedPassword);

                // Add company
                var addedCompany = await _companyRepository.AddCompanyAsync(company);

                // Add associated user
                await _userRepository.AddUserAsync(user);

                return Response<Company>.Successful("Şirket başarıyla kaydedildi.", addedCompany);
            }
            catch (Exception ex)
            {
                return Response<Company>.Fail("Bir hata oluştu: " + ex.Message);
            }
        }
        public async Task<Response<User>> CreateDriverAsync(DriverCreateDto driverDto, Guid companyId)
        {
            try
            {
                if (await _userRepository.IsEmailExistsAsync(driverDto.Email))
                    return Response<User>.Fail("Bu e-posta adresi sistemde zaten mevcut.");

                if (await _userRepository.IsUsernameExistsAsync(driverDto.Username))
                    return Response<User>.Fail("Bu kullanıcı adı zaten alınmış.");

                var hashedPassword = PasswordHasher.HashPassword(driverDto.Password);

                // Mapper'ı çağırırken Service'e gelen CompanyId'yi de veriyoruz
                var driverUser = DriverMapper.MapToDriverUser(driverDto, hashedPassword, companyId);

                var addedDriver = await _userRepository.AddUserAsync(driverUser);

                return Response<User>.Successful("Şoför başarıyla eklendi.", addedDriver);
            }
            catch (Exception ex)
            {
                return Response<User>.Fail("Şoför eklenirken bir hata oluştu: " + ex.Message);
            }
        }
    }
}

