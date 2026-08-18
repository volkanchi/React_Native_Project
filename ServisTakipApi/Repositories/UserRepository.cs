using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Context;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System.Threading.Tasks;

namespace ServisTakipApi.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email && !u.Deleted);
        }

        public async Task<bool> IsUsernameExistsAsync(string username)
        {
            return await _context.Users.AnyAsync(u => u.Username == username && !u.Deleted);
        }

        public async Task<User> AddUserAsync(User user)
        {
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            return user;
        }
        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && !u.Deleted);
        }
        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username && !u.Deleted);
        }
        public async Task<User?> GetUserByIdAsync(Guid id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id && !u.Deleted);
        }
        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> SoftDeleteUserAsync(Guid userId, Guid? actionUserId)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null || user.Deleted)
                return false;

            // Soft Delete 
            user.Deleted = true;
            user.DeleteDate = DateTime.UtcNow;
            user.DeleteUser = actionUserId;

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<User?> GetDriverByIdAndCompanyIdAsync(Guid driverId, Guid companyId)
        {
            // Kullanıcı hem silinmemiş olmalı, hem istenen ID'ye sahip olmalı, hem de bu firmaya ait bir "Şoför" olmalı
            return await _context.Users.FirstOrDefaultAsync(u =>
                u.Id == driverId &&
                u.CompanyId == companyId &&
                u.Role == UserRole.Sofor &&
                !u.Deleted);
        }
    }
}