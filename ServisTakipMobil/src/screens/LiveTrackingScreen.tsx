import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import {
  startSignalRConnection,
  joinRoute,
  subscribeToLocationUpdates,
  stopSignalRConnection,
} from "../services/signalrService";

interface Props {
  routeId: string;
  token: string;
}

export default function LiveTrackingScreen({ routeId, token }: Props) {
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const initConnection = async () => {
      try {
        await startSignalRConnection(token);
        await joinRoute(routeId);

        subscribeToLocationUpdates((data) => {
          setDriverLocation({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        });
      } catch (err) {
        console.error("SignalR Connection Error:", err);
      }
    };

    initConnection();

    return () => {
      stopSignalRConnection();
    };
  }, [routeId, token]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Servis Aracı"
            description="Canlı Konum"
            pinColor="blue"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
});