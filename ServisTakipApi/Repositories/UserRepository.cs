using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Context;
using ServisTakipApi.DTOs.Response;
using ServisTakipApi.DTOs.UserDTOs;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using ServisTakipApi.Mappers;
using ServisTakipApi.Helpers;

namespace ServisTakipApi.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Response<User>> UserRegisterAsync(UserRegisterDto registerUserDto)
        {
            try
            {
                var isUserExistsWithEmail = await _context.Users.AnyAsync(u => u.Email == registerUserDto.Email);
                if (isUserExistsWithEmail)
                {
                    return Response<User>.Fail("Bu e-posta adresi zaten kullanılıyor.");
                }

                var isUserExistsWithUsername = await _context.Users.AnyAsync(u => u.Username == registerUserDto.Username);
                if (isUserExistsWithUsername)
                {
                    return Response<User>.Fail("Bu kullanıcı adı zaten kullanılıyor.");
                }

                var hashedPassword = PasswordHasher.HashPassword(registerUserDto.Password);
                var user = registerUserDto.ToUserModel(hashedPassword);
                
                user.CreateUser = user.Id;

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync(); 

                return Response<User>.Successful("Başarıyla kayıt olundu.", user);
            }
            catch (Exception ex)
            {
                return Response<User>.Fail("Bir hata oluştu: " + ex.Message);
            }
        }
    }
}