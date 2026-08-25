using Microsoft.EntityFrameworkCore;
using Npgsql;
using ServisTakipApi.Context;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Repositories;
using ServisTakipApi.Services;
using ServisTakipApi.Middleware;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using ServisTakipApi.Hubs; // SignalR LocationHub sınıfını tanıyabilmesi için eklendi

var builder = WebApplication.CreateBuilder(args);

// 1. TokenService'i Sisteme Tanıtma
builder.Services.AddScoped<ITokenService, TokenService>();

// 2. JWT Kimlik Doğrulama (Authentication) Ayarları
builder.Services.AddAuthentication(options =>
{
    // Sistemdeki varsayılan doğrulama şemasını "Bearer" olarak ayarlıyoruz
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // appsettings.json'dan gizli anahtarı alıyoruz
    var secretKey = builder.Configuration["JwtSettings:SecretKey"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, // Bileti veren kurumu denetle
        ValidateAudience = true, // Bileti kullanacak kitleyi denetle
        ValidateLifetime = true, // Biletin süresi dolmuş mu denetle
        ValidateIssuerSigningKey = true, // Biletin imzası bizim gizli anahtarımızla mı atılmış denetle

        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ClockSkew = TimeSpan.Zero // Token süresi bittiği an tolerans tanımadan yetkiyi kes
    };

    // 3. SignalR İçin Token Yakalama Olayı (Event)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            // İstek SignalR Hub yoluna geliyorsa token'ı query string'den oku
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/location"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

// 3. (Bonus) Swagger Üzerinden Token Girebilmek İçin Arayüz Ayarı
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ServisTakip API", Version = "v1" });

    // Kilit ikonunu Swagger'a ekler
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Token bilginizi 'Bearer {token}' formatına gerek kalmadan direkt aşağıya yapıştırın."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 1. PostgreSQL & PostGIS Veri Kaynağı Yapılandırması (NetTopologySuite Destekli)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.UseNetTopologySuite(); // Coğrafi konum (Point) desteği
var dataSource = dataSourceBuilder.Build();

// 2. DbContext Kaydı
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dataSource, o => o.UseNetTopologySuite()));

// 3. Canlı Konum Takibi İçin SignalR Servisi
builder.Services.AddSignalR();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IRouteRepository, RouteRepository>();
builder.Services.AddScoped<IRouteService, RouteService>();
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMobile", builder =>
        builder.WithOrigins("http://localhost:*", "http://192.168.*.*")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials()); // SignalR için Credentials izni eklendi
});

var app = builder.Build();

// Global exception handling middleware
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowMobile");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// 4. SignalR Hub Rota Eşlemesi
app.MapHub<LocationHub>("/hubs/location");
app.Run();