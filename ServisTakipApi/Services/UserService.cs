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

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
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
    }
}