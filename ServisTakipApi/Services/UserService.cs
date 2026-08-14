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

                // 2. Şifreyi BCrypt ile doğrula (PasswordHasher sınıfımızı kullanıyoruz)
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return Response<string>.Fail("E-posta adresi veya şifre hatalı."); // Güvenlik: Hangisinin hatalı olduğunu söylemiyoruz
                }

                // 3. Şifre doğruysa Token üret
                var token = _tokenService.GenerateToken(user);

                return Response<string>.Successful("Giriş başarılı.", token);
            }
            catch (Exception ex)
            {
                return Response<string>.Fail("Giriş yapılırken bir hata oluştu: " + ex.Message);
            }
        }
    }
}
