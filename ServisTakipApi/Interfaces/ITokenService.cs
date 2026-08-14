using ServisTakipApi.Models;
namespace ServisTakipApi.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
    
}