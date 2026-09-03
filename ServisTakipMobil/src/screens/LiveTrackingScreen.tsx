import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { storageService } from "../services/storageService";
import { mapService, Coordinate } from "../services/mapService";
import { routeService } from "../services/routeService";
import {
  joinRoute,
  startSignalRConnection,
  stopSignalRConnection,
  subscribeToLocationUpdates,
} from "../services/signalrService";

// Coğrafi mesafe ve en yakın durak sıralama algoritmaları
const toRad = (v: number) => (v * Math.PI) / 180;

const haversineDistance = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const orderStopsByProximity = <
  T extends { latitude: number; longitude: number },
>(
  origin: { latitude: number; longitude: number },
  stops: T[],
): T[] => {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineDistance(current, s);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    });
    const [next] = remaining.splice(nearestIdx, 1);
    ordered.push(next);
    current = next;
  }
  return ordered;
};

export default function LiveTrackingScreen({ route }: any) {
  const { routeId } = route.params || {};

  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [stops, setStops] = useState<Coordinate[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const driverSeen = useRef(false);

  // 1. Durakları backend'den al, coğrafi sıraya diz ve ORS polyline çizgisini çek
  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      const token = await storageService.getToken();
      if (!token || !routeId) return;

      const result = await routeService.getPassengerRoute(routeId, token);
      if (!result.success || !result.data) return;

      const rawStops: Coordinate[] = (result.data.stops || [])
        .filter((stop: any) => stop.location)
        .map((stop: any) => ({
          latitude: stop.location.latitude,
          longitude: stop.location.longitude,
        }));

      if (rawStops.length < 2) {
        if (isMounted) setStops(rawStops);
        return;
      }

      // Başlangıç (0) ve Bitiş (Son) noktalarını sabit tutuyoruz
      const start = rawStops[0];
      const end = rawStops[rawStops.length - 1];

      // Aradaki tüm yolcu duraklarını alıyoruz
      const intermediates = rawStops.length > 2 ? rawStops.slice(1, -1) : [];

      // Başlangıç noktasından itibaren ara durakları en yakından uzağa sırala
      const orderedIntermediates = orderStopsByProximity(start, intermediates);

      // Nihai Güzergah Zinciri: [Başlangıç] -> [Sıralı Yolcular] -> [Varış]
      const finalOrderedStops = [start, ...orderedIntermediates, end];

      if (isMounted) {
        setStops(finalOrderedStops);
        const polylineCoords =
          await mapService.getRoutePolyline(finalOrderedStops);
        if (isMounted && polylineCoords.length > 0) {
          setRouteCoordinates(polylineCoords);
        }
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
            setDriverLocation({
              latitude: data.latitude,
              longitude: data.longitude,
            });

            if (!driverSeen.current) {
              driverSeen.current = true;
              joinRoute(routeId);
            }
          }
        });
      } catch (error) {
        console.error("SignalR Connection Error:", error);
      }
    };

    initConnection();

    return () => {
      isMounted = false;
      stopSignalRConnection();
    };
  }, [routeId]);

  const mapCenter = stops[0]
    ? { latitude: stops[0].latitude, longitude: stops[0].longitude }
    : { latitude: 41.0082, longitude: 28.9784 };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onMapReady={() => setIsMapReady(true)}
      >
        {/* ORS üzerinden hesaplanan gerçek cadde çizgisi */}
        {isMapReady && routeCoordinates.length > 1 && (
          <Polyline
            key={`live-route-polyline-${routeCoordinates.length}`}
            coordinates={routeCoordinates}
            strokeColor="#1E4ED8"
            strokeWidth={5}
            zIndex={999}
            lineJoin="round"
          />
        )}

        {/* Başlangıç, Ara Duraklar ve Varış Pinleri */}
        {isMapReady &&
          stops.map((stop, index) => {
            const isStart = index === 0;
            const isEnd = index === stops.length - 1;

            let pinColor = "#F59E0B"; // Ara duraklar için Turuncu
            let pinTitle = `Durak ${index}`;

            if (isStart) {
              pinColor = "#10B981"; // Yeşil (Başlangıç)
              pinTitle = "Başlangıç Noktası";
            } else if (isEnd) {
              pinColor = "#EF4444"; // Kırmızı (Varış / Şirket)
              pinTitle = "Varış Noktası";
            }

            return (
              <Marker
                key={`stop-pin-${index}-${stop.latitude}`}
                coordinate={stop}
                title={pinTitle}
                pinColor={pinColor}
              />
            );
          })}

        {/* Şoförün canlı SignalR konumu */}
        {isMapReady && driverLocation && (
          <Marker
            key="driver-live-marker"
            coordinate={driverLocation}
            title="Servis Aracı"
            description="Canlı Konum"
            pinColor="#2563EB" // Mavi
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
