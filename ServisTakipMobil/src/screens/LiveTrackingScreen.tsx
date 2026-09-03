import React, { useEffect, useState, useRef, useMemo } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { storageService } from "../services/storageService";
import { mapService, Coordinate } from "../services/mapService";
import { routeService } from "../services/routeService";
import {
  joinRoute,
  startSignalRConnection,
  stopSignalRConnection,
  subscribeToLocationUpdates,
} from "../services/signalrService";
import {
  ServiceDirection,
  RouteAnchor,
  PassengerWaypoint,
  ServiceRouteModel,
} from "../types/routeTracking.types";

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

const orderStopsByProximity = <T extends { latitude: number; longitude: number }>(
  originCoord: { latitude: number; longitude: number },
  stops: T[],
): T[] => {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = originCoord;
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

const normalizeServiceRoute = (raw: any): ServiceRouteModel => {
  const routeName = raw.name || "Servis Güzergahı";
  const nameParts = routeName.includes("-") ? routeName.split("-") : [routeName, "Merkez"];

  const origin: RouteAnchor = {
    label: raw.startPointName || raw.startAddress || `${nameParts[0].trim()} Başlangıç`,
    latitude: Number(raw.startLatitude || raw.origin?.latitude || 41.0025),
    longitude: Number(raw.startLongitude || raw.origin?.longitude || 28.8612),
  };

  const destination: RouteAnchor = {
    label: raw.endPointName || raw.endAddress || `${nameParts[1]?.trim() || "Şirket"} Varış`,
    latitude: Number(raw.endLatitude || raw.destination?.latitude || 41.0365),
    longitude: Number(raw.endLongitude || raw.destination?.longitude || 28.9685),
  };

  const waypoints: PassengerWaypoint[] = (raw.stops || [])
    .filter((s: any) => s.location || (s.latitude && s.longitude))
    .map((s: any, idx: number) => ({
      id: s.id ?? idx,
      passengerId: String(s.passengerId || idx).toLowerCase(),
      label: s.passengerName || s.label || `Durak ${idx + 1}`,
      time: s.time || "08:00",
      latitude: Number(s.latitude || s.location?.latitude),
      longitude: Number(s.longitude || s.location?.longitude),
    }));

  return {
    routeId: raw.routeId || raw.id,
    name: routeName,
    number: raw.number || "SRV",
    routeCode: raw.routeCode || "",
    plate: raw.plate || "",
    vehicleModel: raw.vehicleModel || "",
    capacity: raw.capacity || 16,
    origin,
    destination,
    waypoints,
  };
};

export default function LiveTrackingScreen({ route }: any) {
  const { routeId } = route.params || {};

  const [direction, setDirection] = useState<ServiceDirection>(() =>
    new Date().getHours() >= 13 ? "EVENING" : "MORNING"
  );
  const [routeData, setRouteData] = useState<ServiceRouteModel | null>(null);
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const driverSeen = useRef(false);

  // 1. Backend'den rotayı al ve modelle
  useEffect(() => {
    let isMounted = true;
    const fetchRoute = async () => {
      const token = await storageService.getToken();
      if (!token || !routeId) return;

      const result = await routeService.getPassengerRoute(routeId, token);
      if (!result.success || !result.data) return;

      if (isMounted) {
        setRouteData(normalizeServiceRoute(result.data));
      }
    };

    fetchRoute();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // 2. Canlı SignalR dinleme
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

            // Şoförden gelen yön bilgisi varsa senkronize et
            if (data.direction && (data.direction === "MORNING" || data.direction === "EVENING")) {
              setDirection(data.direction);
            }

            if (!driverSeen.current) {
              driverSeen.current = true;
              joinRoute(routeId);
            }
          }
        });
      } catch (error) {
        console.error("SignalR Canlı Takip Hatası:", error);
      }
    };

    initConnection();
    return () => {
      isMounted = false;
      stopSignalRConnection();
    };
  }, [routeId]);

  // 3. Yöne göre durakları ve polyline'ı hesapla
  const activePlan = useMemo(() => {
    if (!routeData) return null;

    const isMorning = direction === "MORNING";
    const departure = isMorning ? routeData.origin : routeData.destination;
    const arrival = isMorning ? routeData.destination : routeData.origin;

    const orderedWaypoints = orderStopsByProximity(
      { latitude: departure.latitude, longitude: departure.longitude },
      routeData.waypoints
    );

    return {
      departure,
      arrival,
      orderedWaypoints,
    };
  }, [routeData, direction]);

  useEffect(() => {
    let isMounted = true;
    if (!activePlan) return;

    const buildPath = async () => {
      const stops: Coordinate[] = [
        { latitude: activePlan.departure.latitude, longitude: activePlan.departure.longitude },
        ...activePlan.orderedWaypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })),
        { latitude: activePlan.arrival.latitude, longitude: activePlan.arrival.longitude },
      ];

      const polyline = await mapService.getRoutePolyline(stops);
      if (isMounted && polyline.length > 0) {
        setRouteCoordinates(polyline);
      }
    };

    buildPath();
    return () => {
      isMounted = false;
    };
  }, [activePlan]);

  const mapCenter = activePlan
    ? { latitude: activePlan.departure.latitude, longitude: activePlan.departure.longitude }
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
        {isMapReady && routeCoordinates.length > 1 && (
          <Polyline
            key={`live-poly-${direction}-${routeCoordinates.length}`}
            coordinates={routeCoordinates}
            strokeColor="#1E4ED8"
            strokeWidth={5}
            zIndex={999}
            lineJoin="round"
          />
        )}

        {/* Kalkış Noktası (Yeşil Pin) */}
        {isMapReady && activePlan && (
          <Marker
            key={`live-start-${direction}`}
            coordinate={{
              latitude: activePlan.departure.latitude,
              longitude: activePlan.departure.longitude,
            }}
            title={`[Kalkış] ${activePlan.departure.label}`}
            pinColor="#10B981"
          />
        )}

        {/* Ara Yolcu Durakları (Turuncu Pin) */}
        {isMapReady &&
          activePlan &&
          activePlan.orderedWaypoints.map((stop, index) => (
            <Marker
              key={`live-stop-${stop.id}`}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.label}
              description={stop.time}
              pinColor="#F59E0B"
            />
          ))}

        {/* Varış Noktası (Kırmızı Pin) */}
        {isMapReady && activePlan && (
          <Marker
            key={`live-end-${direction}`}
            coordinate={{
              latitude: activePlan.arrival.latitude,
              longitude: activePlan.arrival.longitude,
            }}
            title={`[Varış] ${activePlan.arrival.label}`}
            pinColor="#EF4444"
          />
        )}

        {/* Şoförün Canlı Konumu (Mavi Pin) */}
        {isMapReady && driverLocation && (
          <Marker
            key="driver-live-location"
            coordinate={driverLocation}
            title="Servis Aracı"
            description="Canlı Konum"
            pinColor="#2563EB"
          />
        )}
      </MapView>

      {/* Yolcu Bilgi & Yön Kontrol Barı */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.routeName}>{routeData?.name || "Servis Takip"}</Text>
          <Text style={styles.directionBadge}>
            {direction === "MORNING" ? "Gidiş Servisi (Sabah)" : "Dönüş Servisi (Akşam)"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setDirection((d) => (d === "MORNING" ? "EVENING" : "MORNING"))}
        >
          <Ionicons
            name={direction === "MORNING" ? "moon-outline" : "sunny-outline"}
            size={18}
            color="#1E4ED8"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  floatingHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  headerInfo: { flex: 1 },
  routeName: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  directionBadge: { fontSize: 12, fontWeight: "600", color: "#2563EB", marginTop: 2 },
  switchButton: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 12,
    marginLeft: 12,
  },
});