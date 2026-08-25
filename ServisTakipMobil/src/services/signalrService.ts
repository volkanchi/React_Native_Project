import * as signalR from "@microsoft/signalr";

// Localhost yerine bilgisayarının yerel IP adresini veya Koyeb adresini yaz
const HUB_URL = "http://37.154.248.229:5149/hubs/location";

let connection: signalR.HubConnection | null = null;

export const startSignalRConnection = async (token: string) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect()
    .build();

  await connection.start();
  return connection;
};

export const joinRoute = async (routeId: string) => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("JoinRouteGroup", routeId);
  }
};

export const subscribeToLocationUpdates = (
  callback: (location: any) => void
) => {
  if (connection) {
    connection.on("ReceiveLocationUpdate", callback);
  }
};

export const stopSignalRConnection = async () => {
  if (connection) {
    await connection.stop();
  }
};