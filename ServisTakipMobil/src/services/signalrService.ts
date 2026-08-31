import * as signalR from "@microsoft/signalr";
import { SIGNALR_HUB_URL } from "../constants/config";

let connection: signalR.HubConnection | null = null;

export const startSignalRConnection = async (
  token: string,
): Promise<signalR.HubConnection> => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL, {
      accessTokenFactory: () => token,
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  try {
    await connection.start();
    console.log("SignalR Connected.");
  } catch (err) {
    console.error("SignalR Connection Error: ", err);
  }

  return connection;
};

export const joinRoute = async (routeId: string) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("JoinRouteGroup", routeId);
  } else {
    console.warn("SignalR bağlı değil, gruba katılınamadı.");
  }
};

// Şoför: Anlık konumunu LocationHub üzerinden ilgili rota grubuna basar
// (Backend: LocationHub.SendLocationUpdate, sadece "Driver"/"Sofor" rolü yetkilidir)
export const sendLocationUpdate = async (locationDto: {
  routeId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  timestamp?: string;
}): Promise<boolean> => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    try {
      await connection.invoke("SendLocationUpdate", {
        ...locationDto,
        timestamp: locationDto.timestamp || new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error("Konum gönderme hatası:", err);
      return false;
    }
  }
  return false;
};

export const leaveRoute = async (routeId: string) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("LeaveRouteGroup", routeId);
  }
};

export const subscribeToLocationUpdates = (
  callback: (location: any) => void,
) => {
  if (connection) {
    connection.off("ReceiveLocationUpdate"); // Çift dinlemeyi önlemek için önceki listener'ı temizle
    connection.on("ReceiveLocationUpdate", callback);
  }
};

export const stopSignalRConnection = async () => {
  if (connection) {
    await connection.stop();
    connection = null;
  }
};
export const subscribeToPassengerActivity = (
  onActive: (passengerId: string) => void,
  onInactive: (passengerId: string) => void
) => {
  if (connection) {
    connection.off("PassengerActive");
    connection.off("passengeractive");
    connection.off("PassengerInactive");
    connection.off("passengerinactive");
    
    // Girenler (Hem büyük hem küçük harf dinliyoruz)
    connection.on("PassengerActive", onActive);
    connection.on("passengeractive", onActive);
    
    // Çıkanlar (Hem büyük hem küçük harf dinliyoruz)
    connection.on("PassengerInactive", onInactive);
    connection.on("passengerinactive", onInactive);
  }
};
