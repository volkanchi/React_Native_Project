import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { storageService } from '../services/storageService';
import { mapService, Coordinate } from '../services/mapService';
import { routeService } from '../services/routeService';
import {
  joinRoute,
  startSignalRConnection,
  stopSignalRConnection,
  subscribeToLocationUpdates,
} from '../services/signalrService';

export default function LiveTrackingScreen({ route }: any) {
  const { routeId } = route.params || {}; 
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null); 
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [stops, setStops] = useState<Coordinate[]>([]);
  
  // Şoförü ilk kez gördüğümüzü takip eden referans 
  const driverSeen = useRef(false); 

  // 1. Durakları backend'den al, ardından ORS polyline çizgisini çek
  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      const token = await storageService.getToken();
      if (!token || !routeId) return;

      const result = await routeService.getPassengerRoute(routeId, token);
      if (!result.success || !result.data) return;

      const backendStops: Coordinate[] = (result.data.stops || [])
        .filter((stop: any) => stop.location)
        .sort((a: any, b: any) => a.stopOrder - b.stopOrder)
        .map((stop: any) => ({
          latitude: stop.location.latitude,
          longitude: stop.location.longitude,
        }));

      if (isMounted) {
        setStops(backendStops);
        setRouteCoordinates(await mapService.getRoutePolyline(backendStops));
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // 2. Canlı SignalR bağlantısı ve konum dinleme 
  useEffect(() => {
    let isMounted = true;

    const initConnection = async () => {
      try {
        const token = await storageService.getToken(); 
        if (!token || !routeId) return; 

        await startSignalRConnection(token); 
        await joinRoute(routeId); 

        subscribeToLocationUpdates((data: any) => {
          if (isMounted && data?.latitude && data?.longitude) { 
            setDriverLocation({ latitude: data.latitude, longitude: data.longitude }); 
            
            // Şoförden ilk konum geldiğinde odaya teyit isteği fırlat 
            if (!driverSeen.current) { 
              driverSeen.current = true; 
              joinRoute(routeId); 
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
        initialRegion={{
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {/* ORS üzerinden hesaplanan dinamik mavi rota çizgisi */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#1E4ED8"
            strokeWidth={4}
            lineJoin="round"
          />
        )}

        {/* Durak ve varış noktası pinleri */}
        {stops.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            coordinate={stop}
            title={`Durak ${index + 1}`}
            pinColor="orange"
          />
        ))}

        {/* Şoförün canlı SignalR konumu */}
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