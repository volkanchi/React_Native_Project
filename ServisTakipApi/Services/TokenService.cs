using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ServisTakipApi.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        // appsettings.json içindeki gizli bilgilere ulaşmak için IConfiguration kullanıyoruz
        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateToken(User user)
        {
            // 1. Biletin İçine Koyacağımız Bilgiler (Claims)
            // Bu bilgiler şifrelenmez (Base64 ile kodlanır), bu yüzden ASLA şifre gibi gizli veriler buraya konmaz!
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // Kimlik (ID)
                new Claim(ClaimTypes.Email, user.Email!),                  // E-Posta
                new Claim(ClaimTypes.Role, user.Role.ToString())          // Rol (Admin, Firma, Yolcu, Sofor)
            };

            // Eğer kullanıcının bir firması varsa (Şoför veya Firma ise), o ID'yi de bilete mühürlüyoruz
            if (user.CompanyId.HasValue)
            {
                claims.Add(new Claim("CompanyId", user.CompanyId.Value.ToString()));
            }

            // 2. Güvenlik Anahtarını Hazırlama
            var secretKey = _config["JwtSettings:SecretKey"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 3. Biletin Ayarları (Kim verdi, kime verdi, ne zaman süresi dolacak)
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(double.Parse(_config["JwtSettings:ExpirationInMinutes"]!)),
                Issuer = _config["JwtSettings:Issuer"],
                Audience = _config["JwtSettings:Audience"],
                SigningCredentials = creds
            };

            // 4. Bileti Üret ve Geri Gönder
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}