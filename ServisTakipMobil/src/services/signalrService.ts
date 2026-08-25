import * as signalR from "@microsoft/signalr";

const HUB_URL = "https://servis-takip-api-anir.onrender.com/hubs/location";

let connection: signalR.HubConnection | null = null;

export const startSignalRConnection = async (token: string): Promise<signalR.HubConnection> => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
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

export const leaveRoute = async (routeId: string) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("LeaveRouteGroup", routeId);
  }
};

export const subscribeToLocationUpdates = (
  callback: (location: any) => void
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