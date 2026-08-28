import * as signalR from '@microsoft/signalr';
import {SIGNALR_HUB_URL} from "../constants/config";

let hubConnection: signalR.HubConnection | null = null;

export const startSignalRConnection = async (token: string) => {
  if (hubConnection && hubConnection.state !== signalR.HubConnectionState.Disconnected) {
    return;
  }

  hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL, { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  try {
    await hubConnection.start();
    console.log('✅ SignalR Bağlantısı Başarılı!');
  } catch (error) {
    console.error('❌ SignalR Bağlantı Hatası:', error);
  }
};

export const stopSignalRConnection = async () => {
  if (hubConnection && hubConnection.state !== signalR.HubConnectionState.Disconnected) {
    try {
      await hubConnection.stop();
      hubConnection = null;
      console.log('🛑 SignalR Bağlantısı Güvenli Şekilde Kapatıldı.');
    } catch (error) {
      console.error('❌ SignalR Kapatılırken Hata:', error);
    }
  }
};

// YOLCU VEYA ŞOFÖR GRUBA KATILIR
export const joinRoute = async (routeId: string) => {
  if (hubConnection?.state === signalR.HubConnectionState.Connected) {
    try {
      // C# tarafındaki metod adı: JoinRouteGroup
      await hubConnection.invoke('JoinRouteGroup', routeId);
      console.log(`🔗 Rotaya (Gruba) Katılındı: ${routeId}`);
    } catch (error) {
      console.error('❌ Rotaya katılma hatası:', error);
    }
  } else {
    console.warn('⚠️ SignalR bağlı değil, rotaya katılınamadı.');
  }
};

// ŞOFÖR KONUM GÖNDERİR
export const sendLocationUpdate = async (routeId: string, latitude: number, longitude: number) => {
  if (hubConnection?.state === signalR.HubConnectionState.Connected) {
    try {
      // C# tarafındaki DriverLocationDto nesnesine uygun şekilde obje gönderiyoruz
      const locationDto = {
        routeId: routeId, 
        latitude: latitude,
        longitude: longitude
      };
      
      // C# tarafındaki metod adı: SendLocationUpdate
      await hubConnection.invoke('SendLocationUpdate', locationDto);
    } catch (error) {
      console.error('❌ Konum gönderme hatası:', error);
    }
  }
};

// YOLCU KONUM DİNLER
export const subscribeToLocationUpdates = (callback: (data: { latitude: number, longitude: number }) => void) => {
  if (hubConnection) {
    hubConnection.off('ReceiveLocationUpdate');
    // C# tarafındaki fırlatma adı: ReceiveLocationUpdate
    hubConnection.on('ReceiveLocationUpdate', callback);
  }
};

export const unsubscribeFromLocationUpdates = () => {
  if (hubConnection) {
    hubConnection.off('ReceiveLocationUpdate');
  }
};