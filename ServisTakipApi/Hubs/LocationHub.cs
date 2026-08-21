using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace ServisTakipApi.Hubs
{
    // Hub sınıfından miras alıyoruz, bu sayede canlı bağlantı yetenekleri kazanıyor
    public class LocationHub : Hub
    {
        // Şoför, 5 saniyede bir bu metodu tetikleyecek
        // routeCode: Hangi servisin konumu? (Örn: 34ABC123-8472)
        public async Task SendVehicleLocation(string routeCode, double latitude, double longitude)
        {
            // Sadece o routeCode adlı odaya (gruba) kayıtlı yolculara "ReceiveLocationUpdate" mesajını gönder
            await Clients.Group(routeCode).SendAsync("ReceiveLocationUpdate", latitude, longitude);
        }

        // Yolcu uygulamayı açıp haritaya girdiğinde, kendi servisinin canlı odasına katılır
        public async Task JoinRouteGroup(string routeCode)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, routeCode);
        }

        // Yolcu uygulamayı kapattığında odadan (gruptan) ayrılır
        public async Task LeaveRouteGroup(string routeCode)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, routeCode);
        }
    }
}