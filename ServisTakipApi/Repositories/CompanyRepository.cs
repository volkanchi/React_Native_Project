using Microsoft.EntityFrameworkCore;
using ServisTakipApi.Context;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ServisTakipApi.Repositories
{
    public class CompanyRepository : ICompanyRepository
    {
        private readonly AppDbContext _context;

        public CompanyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _context.Companies.AnyAsync(c => c.Email == email && !c.Deleted);
        }

        public async Task<bool> IsUsernameExistsAsync(string username)
        {
            return await _context.Companies.AnyAsync(c => c.Username == username && !c.Deleted);
        }

        public async Task<bool> IsEmailExistsExceptAsync(string email, Guid companyId)
        {
            return await _context.Companies.AnyAsync(c => c.Email == email && c.Id != companyId && !c.Deleted);
        }

        public async Task<bool> IsUsernameExistsExceptAsync(string username, Guid companyId)
        {
            return await _context.Companies.AnyAsync(c => c.Username == username && c.Id != companyId && !c.Deleted);
        }

        public async Task<Company> AddCompanyAsync(Company company)
        {
            await _context.Companies.AddAsync(company);
            await _context.SaveChangesAsync();
            return company;
        }

        public async Task<Company> UpdateCompanyAsync(Company company)
        {
            _context.Companies.Update(company);
            await _context.SaveChangesAsync();
            return company;
        }

        public async Task<Company?> GetCompanyByIdAsync(Guid id)
        {
            return await _context.Companies.FirstOrDefaultAsync(c => c.Id == id && !c.Deleted);
        }

        public async Task<Company?> GetCompanyByUsernameAsync(string username)
        {
            return await _context.Companies.FirstOrDefaultAsync(c => c.Username == username && !c.Deleted);
        }

        public async Task<List<Company>> GetAllCompaniesAsync()
        {
            return await _context.Companies
                .Where(c => !c.Deleted)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> SoftDeleteCompanyAsync(Guid companyId)
        {
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null || company.Deleted)
                return false;

            company.Deleted = true;
            _context.Companies.Update(company);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
