import * as signalR from '@microsoft/signalr';
import {SIGNALR_HUB_URL} from "../constants/config"

let hubConnection: signalR.HubConnection | null = null;

// 1. TEMEL BAĞLANTI YÖNETİMİ
export const startSignalRConnection = async (token: string) => {
  if (hubConnection && hubConnection.state !== signalR.HubConnectionState.Disconnected) {
    return; // Zaten bağlıysa veya bağlanıyorsa işlemi iptal et
  }

  hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL, { accessTokenFactory: () => token })
    .withAutomaticReconnect() // Bağlantı koparsa otomatik tekrar dener
    .configureLogging(signalR.LogLevel.Warning) // Konsol kirliliğini önler
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

export const joinRoute = async (routeId: string) => {
  if (hubConnection?.state === signalR.HubConnectionState.Connected) {
    try {
      await hubConnection.invoke('JoinRoute', routeId);
      console.log(`🔗 Rotaya (Gruba) Katılındı: ${routeId}`);
    } catch (error) {
      console.error('❌ Rotaya katılma hatası:', error);
    }
  } else {
    console.warn('⚠️ SignalR bağlı değil, rotaya katılınamadı.');
  }
};

// 2. ŞOFÖR İÇİN (SENDER / GÖNDERİCİ)

export const sendLocationUpdate = async (routeId: string, latitude: number, longitude: number) => {
  if (hubConnection?.state === signalR.HubConnectionState.Connected) {
    try {
      // Backend'deki Hub metodunun adı: UpdateLocation
      await hubConnection.invoke('UpdateLocation', routeId, latitude, longitude);
    } catch (error) {
      console.error('❌ Konum gönderme hatası:', error);
    }
  }
};

// 3. YOLCU İÇİN (LISTENER / DİNLEYİCİ)
export const subscribeToLocationUpdates = (callback: (data: { latitude: number, longitude: number }) => void) => {
  if (hubConnection) {
    // Backend'in yayın yaptığı metod adı: ReceiveLocationUpdate
    // Önceki dinleyicileri temizle (çift tetiklenmeyi önlemek için)
    hubConnection.off('ReceiveLocationUpdate');
    hubConnection.on('ReceiveLocationUpdate', callback);
  }
};

// Bileşen ekrandan ayrıldığında (unmount) dinlemeyi bırakmak için
export const unsubscribeFromLocationUpdates = () => {
  if (hubConnection) {
    hubConnection.off('ReceiveLocationUpdate');
  }
};