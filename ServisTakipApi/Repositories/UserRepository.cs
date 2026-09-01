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

        public async Task<Driver> AddDriverProfileAsync(Driver driver)
        {
            await _context.Drivers.AddAsync(driver);
            await _context.SaveChangesAsync();
            return driver;
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
        public async Task<Driver?> GetDriverProfileByIdAndCompanyIdAsync(Guid driverId, Guid companyId)
        {
            return await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d =>
                    d.Id == driverId &&
                    d.User.CompanyId == companyId &&
                    d.User.Role == UserRole.Sofor &&
                    !d.User.Deleted);
        }
        public async Task<List<Driver>> GetDriversByCompanyIdAsync(Guid companyId)
        {
            return await _context.Drivers
                .Include(d => d.User)
                .Where(d => d.User.CompanyId == companyId && !d.User.Deleted)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Driver?> GetDriverByIdAsync(Guid driverId)
        {
            return await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverId && !d.User.Deleted);
        }

        public async Task<Driver> UpdateDriverAsync(Driver driver)
        {
            _context.Drivers.Update(driver);
            await _context.SaveChangesAsync();
            return driver;
        }

        public async Task<bool> SoftDeleteDriverAsync(Guid driverId, Guid companyId, Guid? actionUserId)
        {
            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverId && d.User.CompanyId == companyId);

            if (driver == null || driver.User.Deleted)
                return false;

            driver.User.Deleted = true;
            driver.User.DeleteDate = DateTime.UtcNow;
            driver.User.DeleteUser = actionUserId;

            _context.Drivers.Update(driver);
            _context.Users.Update(driver.User);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}