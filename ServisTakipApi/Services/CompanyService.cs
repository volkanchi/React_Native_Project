using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.DriverDTOs;
using ServisTakipApi.Helpers;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Mappers;
using ServisTakipApi.Models;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<CompanyService> _logger;

        public CompanyService(ICompanyRepository companyRepository, IUserRepository userRepository, ILogger<CompanyService> logger)
        {
            _companyRepository = companyRepository;
            _userRepository = userRepository;
            _logger = logger;
        }
        public async Task<Response<Company>> RegisterCompanyAsync(CompanyCreateDto companyDto)
        {
            try
            {
                if (await _companyRepository.IsEmailExistsAsync(companyDto.Email))
                {
                    _logger.LogWarning("Şirket kaydı başarısız: Email zaten kullanılıyor - {Email}", companyDto.Email);
                    return Response<Company>.Fail("Bu e-posta adresi zaten kullanılıyor.");
                }

                // Check if username exists in both company and user repositories
                if (await _companyRepository.IsUsernameExistsAsync(companyDto.Username))
                {
                    _logger.LogWarning("Şirket kaydı başarısız: Username zaten kullanılıyor (company) - {Username}", companyDto.Username);
                    return Response<Company>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                if (await _userRepository.IsUsernameExistsAsync(companyDto.Username))
                {
                    _logger.LogWarning("Şirket kaydı başarısız: Username zaten kullanılıyor (user) - {Username}", companyDto.Username);
                    return Response<Company>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                // Hash password
                var hashedPassword = PasswordHasher.HashPassword(companyDto.Password);

                // Map to models
                var (company, user) = companyDto.ToCompanyAndUserModel(hashedPassword);

                // Add company
                var addedCompany = await _companyRepository.AddCompanyAsync(company);
                _logger.LogInformation("Şirket başarıyla kaydedildi - CompanyId: {CompanyId}, CompanyName: {CompanyName}", addedCompany.Id, addedCompany.CompanyName);

                // Add associated user
                await _userRepository.AddUserAsync(user);
                _logger.LogInformation("Şirket için yönetici kullanıcı oluşturuldu - UserId: {UserId}", user.Id);

                return Response<Company>.Successful("Şirket başarıyla kaydedildi.", addedCompany);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şirket kaydı sırasında hata oluştu");
                return Response<Company>.Fail("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            }
        }

        public async Task<Response<Company>> UpdateCompanyAsync(Guid companyId, CompanyUpdateDto companyDto)
        {
            try
            {
                var company = await _companyRepository.GetCompanyByIdAsync(companyId);
                if (company == null)
                    return Response<Company>.Fail("Şirket bulunamadı.");

                var admin = await _userRepository.GetUserByUsernameAsync(company.Username);
                var email = companyDto.Email.Trim();
                var username = companyDto.Username.Trim();

                if (await _companyRepository.IsEmailExistsExceptAsync(email, companyId))
                    return Response<Company>.Fail("Bu e-posta adresi zaten kullanılıyor.");

                if (await _companyRepository.IsUsernameExistsExceptAsync(username, companyId) ||
                    (username != company.Username && await _userRepository.IsUsernameExistsAsync(username)))
                    return Response<Company>.Fail("Bu kullanıcı adı zaten kullanılıyor.");

                company.CompanyName = companyDto.CompanyName.Trim();
                company.Address = companyDto.Address.Trim();
                company.PhoneNumber = companyDto.PhoneNumber.Trim();
                company.Email = email;
                company.Username = username;
                company.TaxNumber = companyDto.TaxNumber?.Trim();

                if (admin != null && admin.CompanyId == companyId && admin.Role == UserRole.Firma)
                {
                    admin.Name = company.CompanyName;
                    admin.Email = company.Email;
                    admin.Username = company.Username;
                    admin.PhoneNumber = company.PhoneNumber;
                    admin.UpdateDate = DateTime.UtcNow;
                    admin.UpdateUser = companyId;
                    await _userRepository.UpdateUserAsync(admin);
                }

                var updatedCompany = await _companyRepository.UpdateCompanyAsync(company);
                return Response<Company>.Successful("Şirket bilgileri güncellendi.", updatedCompany);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şirket güncellenirken hata oluştu - CompanyId: {CompanyId}", companyId);
                return Response<Company>.Fail("Güncelleme sırasında hata oluştu. Lütfen daha sonra tekrar deneyin.");
            }
        }
        public async Task<Response<DriverResponseDto>> CreateDriverAsync(DriverCreateDto driverDto, Guid companyId)
        {
            try
            {
                // Validate that company exists
                var company = await _companyRepository.GetCompanyByIdAsync(companyId);
                if (company == null || company.Deleted)
                {
                    _logger.LogWarning("Şoför oluşturma başarısız: Şirket bulunamadı veya silinmiş - CompanyId: {CompanyId}", companyId);
                    return Response<DriverResponseDto>.Fail("Şirket bulunamadı veya silinmiştir.");
                }

                if (await _userRepository.IsEmailExistsAsync(driverDto.Email))
                {
                    _logger.LogWarning("Şoför oluşturma başarısız: Email zaten kullanılıyor - {Email}", driverDto.Email);
                    return Response<DriverResponseDto>.Fail("Bu e-posta adresi sistemde zaten mevcut.");
                }

                if (await _userRepository.IsUsernameExistsAsync(driverDto.Username))
                {
                    _logger.LogWarning("Şoför oluşturma başarısız: Username zaten kullanılıyor - {Username}", driverDto.Username);
                    return Response<DriverResponseDto>.Fail("Bu kullanıcı adı zaten alınmış.");
                }

                var hashedPassword = PasswordHasher.HashPassword(driverDto.Password);

                // Pass actionUserId (companyId) to mapper for audit trail
                var driverUser = DriverMapper.MapToDriverUser(driverDto, hashedPassword, companyId, companyId);

                var addedDriver = await _userRepository.AddUserAsync(driverUser);
                var driverProfile = await _userRepository.AddDriverProfileAsync(new Driver
                {
                    UserId = addedDriver.Id,
                    PlateNumber = string.Empty,
                    Capacity = 0
                });
                _logger.LogInformation("Şoför başarıyla eklendi - DriverId: {DriverId}, UserId: {UserId}, CompanyId: {CompanyId}, DriverName: {DriverName}", driverProfile.Id, addedDriver.Id, companyId, addedDriver.Name);

                return Response<DriverResponseDto>.Successful("Şoför başarıyla eklendi.", ToDriverResponse(driverProfile, addedDriver));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şoför eklenirken hata oluştu - CompanyId: {CompanyId}", companyId);
                return Response<DriverResponseDto>.Fail("Şoför eklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            }
        }
        public async Task<Response<DriverResponseDto>> UpdateDriverAsync(Guid driverId, Guid companyId, DriverUpdateDto updateDto)
        {
            try
            {
                // DriverId is the profile ID; UserId remains the authentication identity.
                var driver = await _userRepository.GetDriverProfileByIdAndCompanyIdAsync(driverId, companyId);
                if (driver == null)
                {
                    _logger.LogWarning("Şoför güncelleme başarısız: Şoför bulunamadı - DriverId: {DriverId}, CompanyId: {CompanyId}", driverId, companyId);
                    return Response<DriverResponseDto>.Fail("Şoför bulunamadı veya bu şoför üzerinde yetkiniz yok.");
                }

                driver.User.Name = updateDto.Name;
                driver.User.Surname = updateDto.Surname;
                driver.User.PhoneNumber = updateDto.PhoneNumber;

                driver.User.UpdateDate = DateTime.UtcNow;
                driver.User.UpdateUser = companyId;

                var updatedDriver = await _userRepository.UpdateUserAsync(driver.User);
                _logger.LogInformation("Şoför bilgileri güncellendi - DriverId: {DriverId}, UpdatedBy: {UpdatedBy}", driverId, companyId);

                return Response<DriverResponseDto>.Successful("Şoför bilgileri güncellendi.", ToDriverResponse(driver, updatedDriver));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şoför güncellemesi sırasında hata oluştu - DriverId: {DriverId}, CompanyId: {CompanyId}", driverId, companyId);
                return Response<DriverResponseDto>.Fail("Güncelleme sırasında hata oluştu. Lütfen daha sonra tekrar deneyin.");
            }
        }
        public async Task<Response<bool>> DeleteDriverAsync(Guid driverId, Guid companyId)
        {
            try
            {
                var driver = await _userRepository.GetDriverProfileByIdAndCompanyIdAsync(driverId, companyId);
                if (driver == null)
                {
                    _logger.LogWarning("Şoför silme başarısız: Şoför bulunamadı - DriverId: {DriverId}, CompanyId: {CompanyId}", driverId, companyId);
                    return Response<bool>.Fail("Şoför bulunamadı veya bu şoför üzerinde yetkiniz yok.");
                }

                // Var olan SoftDelete metodumuzu kullanıyoruz (actionUserId olarak Firmanın ID'sini veriyoruz)
                await _userRepository.SoftDeleteUserAsync(driver.UserId, companyId);
                _logger.LogInformation("Şoför silindi - DriverId: {DriverId}, DeletedBy: {DeletedBy}", driverId, companyId);

                return Response<bool>.Successful("Şoför sistemden başarıyla silindi.", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Şoför silme işlemi sırasında hata oluştu - DriverId: {DriverId}, CompanyId: {CompanyId}", driverId, companyId);
                return Response<bool>.Fail("Silme işlemi sırasında hata oluştu. Lütfen daha sonra tekrar deneyin.");
            }
        }

        private static DriverResponseDto ToDriverResponse(Driver driver, User user)
        {
            return new DriverResponseDto
            {
                DriverId = driver.Id,
                UserId = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email,
                Username = user.Username,
                PhoneNumber = user.PhoneNumber
            };
        }
    }
}
