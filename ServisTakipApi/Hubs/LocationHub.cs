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
        }

        // 2. Yolcu: Takibi bıraktığında gruptan ayrılır
        public async Task LeaveRouteGroup(string routeId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, routeId);
        }

        // 3. Sürücü: Anlık konumunu basar (Sadece Driver rolü yetkilidir)
        [Authorize(Roles = "Driver")]
        public async Task SendLocationUpdate(DriverLocationDto locationDto)
        {
            // İlgili rotayı dinleyen tüm yolculara konumu anlık fırlat
            await Clients.Group(locationDto.RouteId.ToString())
                .SendAsync("ReceiveLocationUpdate", locationDto);
        }
    }
}