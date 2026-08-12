using Microsoft.EntityFrameworkCore;
using Npgsql;
using ServisTakipApi.Context;

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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

// 4. SignalR Hub Rota Eşlemesi (Birazdan yazacağımız canlı konum sınıfı için)
// app.MapHub<LiveLocationHub>("/hubs/location");

app.Run();