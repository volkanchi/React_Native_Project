using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using ServisTakipApi.Helpers;
using ServisTakipApi.Mappers;
using System;
using System.Threading.Tasks;

namespace ServisTakipApi.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public UserService(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        public async Task<Response<User>> RegisterUserAsync(UserRegisterDto registerUserDto)
        {
            try
            {
                // E-posta ve Kullanıcı Adı kontrollerinde senin Fail(string message) metodunu kullanıyoruz
                if (await _userRepository.IsEmailExistsAsync(registerUserDto.Email))
                {
                    return Response<User>.Fail("Bu e-posta adresi zaten kullanılıyor.");
                }

                if (await _userRepository.IsUsernameExistsAsync(registerUserDto.Username))
                {
                    return Response<User>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                var hashedPassword = PasswordHasher.HashPassword(registerUserDto.Password);

                // Daha önce yazdığımız manuel Mapper'ı burada devreye sokuyoruz
                var user = registerUserDto.ToUserModel(hashedPassword);

                var addedUser = await _userRepository.AddUserAsync(user);

                // İşlem başarılı olduğunda Successful(string message, T data) metodunu tetikliyoruz
                return Response<User>.Successful("Başarıyla kayıt olundu.", addedUser);
            }
            catch (Exception ex)
            {
                return Response<User>.Fail("Bir hata oluştu: " + ex.Message);
            }
        }
        public async Task<Response<string>> LoginUserAsync(UserLoginDto loginDto)
        {
            try
            {
                // 1. Kullanıcıyı bul
                var user = await _userRepository.GetUserByEmailAsync(loginDto.Email);
                if (user == null)
                {
                    return Response<string>.Fail("E-posta adresi veya şifre hatalı.");
                }

                // 2. PasswordHash kontrolü (null olması durumunda)
                if (string.IsNullOrEmpty(user.PasswordHash))
                {
                    return Response<string>.Fail("E-posta adresi veya şifre hatalı.");
                }

                // 3. Şifreyi BCrypt ile doğrula (PasswordHasher sınıfımızı kullanıyoruz)
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return Response<string>.Fail("E-posta adresi veya şifre hatalı."); // Güvenlik: Hangisinin hatalı olduğunu söylemiyoruz
                }

                // 4. Şifre doğruysa Token üret
                var token = _tokenService.GenerateToken(user);

                return Response<string>.Successful("Giriş başarılı.", token);
            }
            catch (Exception ex)
            {
                return Response<string>.Fail("Giriş yapılırken bir hata oluştu: " + ex.Message);
            }
        }
        public async Task<Response<User>> UpdateUserAsync(Guid userId, UserUpdateDto updateDto, Guid actionUserId)
        {
            try
            {
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                    return Response<User>.Fail("Kullanıcı bulunamadı.");

                // Bilgileri güncelliyoruz
                user.Name = updateDto.Name;
                user.Surname = updateDto.Surname;
                // Not: User modelindeki alan adın Phone ise user.Phone, PhoneNumber ise user.PhoneNumber yazmalısın.
                user.PhoneNumber = updateDto.PhoneNumber;

                // Denetim (Audit) Alanları
                user.UpdateDate = DateTime.UtcNow;
                user.UpdateUser = actionUserId;

                var updatedUser = await _userRepository.UpdateUserAsync(user);
                return Response<User>.Successful("Profil başarıyla güncellendi.", updatedUser);
            }
            catch (Exception ex)
            {
                return Response<User>.Fail("Güncelleme sırasında bir hata oluştu: " + ex.Message);
            }
        }

        public async Task<Response<bool>> DeleteUserAsync(Guid userId, Guid actionUserId)
        {
            try
            {
                var isDeleted = await _userRepository.SoftDeleteUserAsync(userId, actionUserId);

                if (!isDeleted)
                    return Response<bool>.Fail("Kullanıcı bulunamadı veya zaten silinmiş.");

                return Response<bool>.Successful("Hesap başarıyla silindi.", true);
            }
            catch (Exception ex)
            {
                return Response<bool>.Fail("Silme işlemi sırasında bir hata oluştu: " + ex.Message);
            }
        }
        public async Task<Response<User>> GetProfileAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null)
                return Response<User>.Fail("Kullanıcı bulunamadı.");

            return Response<User>.Successful("Profil bilgileri getirildi.", user);
        }
    }
}
