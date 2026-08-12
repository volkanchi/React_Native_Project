using BCrypt.Net;
namespace ServisTakipApi.Helpers
{
    public static class PasswordHasher
    {
        // sifreyi bcrypt ile hashler static olarak herhangi bir yerde kullanilabilir
        public static string HashPassword(string plainPassword)
        {
            return BCrypt.Net.BCrypt.HashPassword(plainPassword);
        }

        public static bool VerifyPassword(string plainPassword, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
        }
    }
}