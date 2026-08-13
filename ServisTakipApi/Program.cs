using Microsoft.EntityFrameworkCore;
using Npgsql;
using ServisTakipApi.Context;
using ServisTakipApi.Interfaces;
using ServisTakipApi.Repositories;
using ServisTakipApi.Services;
using ServisTakipApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMobile", builder =>
        builder.WithOrigins("http://localhost:*", "http://192.168.*.*")
               .AllowAnyMethod()
               .AllowAnyHeader());
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
app.UseAuthorization();
app.MapControllers();

// 4. SignalR Hub Rota Eşlemesi (Birazdan yazacağımız canlı konum sınıfı için)
// app.MapHub<LiveLocationHub>("/hubs/location");

app.Run();