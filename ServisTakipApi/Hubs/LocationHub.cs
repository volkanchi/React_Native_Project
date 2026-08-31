using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using ServisTakipApi.DTOs.DriverDTOs;

namespace ServisTakipApi.Hubs
{
    public class LocationHub : Hub
    {
        // 1. Yolcu veya Veli: Belirli bir servisin/rotanın canlı yayınına katılır
       public async Task JoinRouteGroup(string routeId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, routeId);
            
            // Giren kişinin ID'sini ve Rolünü Token üzerinden alıyoruz
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

            // Eğer odaya giren kişi "Yolcu" ise, şoförün haritasında pini açması için odaya mesaj at
            if (role == "Yolcu" && !string.IsNullOrEmpty(userId))
            {
                await Clients.Group(routeId).SendAsync("PassengerActive", userId);
            }
        }
        // 2. Yolcu: Takibi bıraktığında gruptan ayrılır
        public async Task LeaveRouteGroup(string routeId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, routeId);
            
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Çıkan yolcuyu şoförün haritasından silmek için mesaj at
                await Clients.Group(routeId).SendAsync("PassengerInactive", userId);
            }
        }
        // 3. Sürücü: Anlık konumunu basar (Sadece Driver rolü yetkilidir)
        [Authorize(Roles = "Sofor")]
        public async Task SendLocationUpdate(DriverLocationDto locationDto)
        {
            // İlgili rotayı dinleyen tüm yolculara konumu anlık fırlat
            await Clients.Group(locationDto.RouteId.ToString())
                .SendAsync("ReceiveLocationUpdate", locationDto);
        }
    }
}