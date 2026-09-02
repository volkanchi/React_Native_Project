using Microsoft.Extensions.Logging;
using ServisTakipApi.DTOs.CompanyDTOs;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.Services
{
    public class AdminService : IAdminService
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<AdminService> _logger;

        public AdminService(ICompanyRepository companyRepository, IUserRepository userRepository, ILogger<AdminService> logger)
        {
            _companyRepository = companyRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<Response<IEnumerable<CompanyResponseDto>>> GetAllCompaniesAsync()
        {
            try
            {
                var companies = await _companyRepository.GetAllCompaniesAsync();
                var result = companies.Select(c => new CompanyResponseDto
                {
                    Id = c.Id,
                    CompanyName = c.CompanyName,
                    Username = c.Username,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    TaxNumber = c.TaxNumber,
                    Address = c.Address,
                    CreateDate = c.CreateDate
                });
                return Response<IEnumerable<CompanyResponseDto>>.Successful(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Firmalar listelenirken hata oluştu");
                return Response<IEnumerable<CompanyResponseDto>>.Fail("Firmalar getirilirken bir hata oluştu.");
            }
        }

        public async Task<Response<bool>> DeleteCompanyAsync(Guid companyId)
        {
            try
            {
                var isDeleted = await _companyRepository.SoftDeleteCompanyAsync(companyId);
                if (!isDeleted)
                    return Response<bool>.Fail("Firma bulunamadı veya zaten silinmiş.");

                return Response<bool>.Successful("Firma başarıyla silindi.", true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Firma silinirken hata oluştu - CompanyId: {CompanyId}", companyId);
                return Response<bool>.Fail("Silme işlemi sırasında bir hata oluştu.");
            }
        }

        public async Task<Response<IEnumerable<AdminUserResponseDto>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync();
                var result = users.Select(u => new AdminUserResponseDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Surname = u.Surname,
                    Username = u.Username,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Role = u.Role,
                    CompanyId = u.CompanyId,
                    CreateDate = u.CreateDate
                });
                return Response<IEnumerable<AdminUserResponseDto>>.Successful(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcılar listelenirken hata oluştu");
                return Response<IEnumerable<AdminUserResponseDto>>.Fail("Kullanıcılar getirilirken bir hata oluştu.");
            }
        }
    }
}
