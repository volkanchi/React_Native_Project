import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { storageService } from '../services/storageService'; // Token'ı kendisi alacak

import {
  joinRoute,
  startSignalRConnection,
  stopSignalRConnection,
  subscribeToLocationUpdates,
} from '../services/signalrService';

// Navigation üzerinden gelecek parametreler (routeId)
export default function LiveTrackingScreen({ route }: any) {
  // PassengerMainScreen'den gönderilen routeId'yi alıyoruz
  const { routeId } = route.params || {};

  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initConnection = async () => {
      try {
        // Token'ı navigation props'tan değil, doğrudan cihaz hafızasından güvenle çekiyoruz
        const token = await storageService.getToken(); 
        if (!token || !routeId) return;

        await startSignalRConnection(token);
        await joinRoute(routeId);

        subscribeToLocationUpdates((data: any) => {
          if (isMounted && data) {
            setDriverLocation({
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
        });
      } catch (error) {
        console.error('SignalR Connection Error:', error);
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      stopSignalRConnection();
    };
  }, [routeId]);

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
        }}>
        {/* Eğer SignalR'dan şoför konumu geldiyse haritada MAVİ PİN olarak göster */}
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
  map: { width: '100%', height: '100%' },
});