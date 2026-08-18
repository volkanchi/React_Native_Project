using BCrypt.Net;

namespace ServisTakipApi.Helpers
{
    /// <summary>
    /// Şifre hash işlemleri için yardımcı sınıf
    /// BCrypt algoritmasını kullanarak güvenli şifre şifreleme ve doğrulama sağlar
    /// </summary>
    public static class PasswordHasher
    {
        /// <summary>
        /// Düz metin şifreyi BCrypt ile hashler
        /// </summary>
        /// <param name="plainPassword">Hash'lenecek düz metin şifre</param>
        /// <returns>Hash'lenmiş şifre</returns>
        public static string HashPassword(string plainPassword)
        {
            return BCrypt.Net.BCrypt.HashPassword(plainPassword);
        }

        /// <summary>
        /// Düz metin şifreyi hash'lenmiş şifre ile karşılaştırır
        /// </summary>
        /// <param name="plainPassword">Doğrulanacak düz metin şifre</param>
        /// <param name="hashedPassword">Veritabanında saklanan hash'lenmiş şifre</param>
        /// <returns>Şifre doğru ise true, yanlış ise false</returns>
        public static bool VerifyPassword(string plainPassword, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);
        }
    }
}
