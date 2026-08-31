import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { storageService } from '../services/storageService';
import {
  joinRoute,
  startSignalRConnection,
  stopSignalRConnection,
  subscribeToLocationUpdates,
} from '../services/signalrService';

export default function LiveTrackingScreen({ route }: any) {
  const { routeId } = route.params || {};
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Şoförü ilk kez gördüğümüzü takip etmek için bir Referans oluşturuyoruz
  const driverSeen = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const initConnection = async () => {
      try {
        const token = await storageService.getToken();
        if (!token || !routeId) return;

        await startSignalRConnection(token);
        await joinRoute(routeId);

        subscribeToLocationUpdates((data: any) => {
          if (isMounted && data) {
            setDriverLocation({ latitude: data.latitude, longitude: data.longitude });
            
            // Şoförden İLK DEFA konum aldığımızda, ona tekrar "Ben buradayım" diyoruz.
            // Bu sayede şoför bizden SONRA girmiş olsa bile bizi haritasında kesinlikle görür!
            if (!driverSeen.current) {
              driverSeen.current = true;
              joinRoute(routeId); // Backend'i yormadan sadece tetikleme yapar
            }
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
        initialRegion={{ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {driverLocation && (
          <Marker coordinate={driverLocation} title="Servis Aracı" description="Canlı Konum" pinColor="blue" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});