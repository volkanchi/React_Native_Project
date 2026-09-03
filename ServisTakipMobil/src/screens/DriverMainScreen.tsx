import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  LayoutAnimation,
  AppState,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Feather, Ionicons } from "@expo/vector-icons";
import { storageService } from "../services/storageService";
import { routeService } from "../services/routeService";
import { mapService, Coordinate } from "../services/mapService";
import {
  startSignalRConnection,
  stopSignalRConnection,
  sendLocationUpdate,
  subscribeToPassengerActivity,
  joinRoute,
} from "../services/signalrService";

type DriverStop = {
  id: number;
  passengerId: string;
  label: string;
  time: string;
  latitude: number;
  longitude: number;
};

type RouteState = {
  routeId: string;
  name: string;
  number: string;
  routeCode: string;
  plate: string;
  vehicleModel: string;
  capacity: number;
  stops: DriverStop[];
};

const EMPTY_STOPS: DriverStop[] = [];

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

interface DriverMainScreenProps {
  onLogout: () => void;
  selectedRouteId?: string;
  onRequireRouteSelection?: () => void;
}

export default function DriverMainScreen({
  onLogout,
  selectedRouteId,
  onRequireRouteSelection,
}: DriverMainScreenProps) {
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [showRouteSelect, setShowRouteSelect] = useState(false);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeData, setRouteData] = useState<RouteState | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const driverCoordRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const routeRequestIdRef = useRef(0);
  const hasFirstLocationRef = useRef(false);
  const [routeTrigger, setRouteTrigger] = useState(0);

  const [driverCoord, setDriverCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pathTraveled, setPathTraveled] = useState<{ latitude: number; longitude: number }[]>([]);
  const [usingSimulatedLocation, setUsingSimulatedLocation] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [activePassengers, setActivePassengers] = useState<string[]>([]);

  const watchSubRef = useRef<Location.LocationSubscription | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeIdRef = useRef<string>("");

  const toggleSheet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetExpanded((expanded) => !expanded);
  };

  useEffect(() => {
    initDriverRoutes(selectedRouteId);
  }, [selectedRouteId]);

  const initDriverRoutes = async (targetRouteId?: string) => {
    setLoadingRoutes(true);
    const token = await storageService.getToken();
    if (!token) {
      setLoadingRoutes(false);
      return;
    }

    if (targetRouteId) {
      await loadRouteDetail(targetRouteId, token);
      setLoadingRoutes(false);
      return;
    }

    const res = await routeService.getDriverRoutes(token);
    if (res.success && Array.isArray(res.data)) {
      setAvailableRoutes(res.data);
      if (res.data.length === 1) {
        await loadRouteDetail(res.data[0].routeId, token);
        setShowRouteSelect(false);
      } else if (res.data.length > 1) {
        setShowRouteSelect(true);
        onRequireRouteSelection?.();
      } else {
        setRouteData(null);
      }
    } else {
      await loadRouteDetail(undefined, token);
    }
    setLoadingRoutes(false);
  };

  const loadRouteDetail = async (routeIdParam?: string, tokenParam?: string) => {
    const token = tokenParam || (await storageService.getToken());
    if (!token) return;

    const res = await routeService.getDriverRoute(token, routeIdParam);
    if (res.success && res.data) {
      routeIdRef.current = res.data.routeId;
      setRouteData({
        routeId: res.data.routeId,
        name: res.data.name,
        number: "SRV",
        routeCode: res.data.routeCode,
        plate: res.data.plate,
        vehicleModel: res.data.vehicleModel,
        capacity: res.data.capacity,
        stops: (res.data.stops || []).map((s: any) => ({
          id: s.id,
          passengerId: s.passengerId,
          label: s.passengerName || s.label,
          time: s.time,
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      });
      setShowRouteSelect(false);
    } else {
      setRouteData(null);
    }
  };

  const handleSelectRouteFromList = async (routeId: string) => {
    setLoadingRoutes(true);
    await loadRouteDetail(routeId);
    setLoadingRoutes(false);
  };

  useEffect(() => {
    if (tripActive) {
      timerIntervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [tripActive]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", () => {});
    return () => sub.remove();
  }, []);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleLocationUpdate = (
    lat: number,
    lng: number,
    speed?: number | null,
    heading?: number | null,
  ) => {
    const coord = { latitude: lat, longitude: lng };
    driverCoordRef.current = coord;
    setDriverCoord(coord);
    setPathTraveled((prev) => [...prev.slice(-200), coord]);

    if (!hasFirstLocationRef.current) {
      hasFirstLocationRef.current = true;
      setRouteTrigger((prev) => prev + 1);
    }

    if (!routeIdRef.current) return;
    sendLocationUpdate({
      routeId: routeIdRef.current,
      latitude: lat,
      longitude: lng,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
    });
  };

  const simulateStep = () => {
    const routeStops = routeData?.stops ?? [];
    if (routeStops.length === 0) return;
    setDriverCoord((prev) => {
      const target = routeStops[Math.min(currentStopIndex, routeStops.length - 1)];
      const base = prev ?? {
        latitude: target.latitude,
        longitude: target.longitude,
      };
      const nextLat = base.latitude + (target.latitude - base.latitude) * 0.25;
      const nextLng = base.longitude + (target.longitude - base.longitude) * 0.25;
      handleLocationUpdate(nextLat, nextLng, 8.5, 0);
      return { latitude: nextLat, longitude: nextLng };
    });
  };

  const startLocationBroadcast = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setUsingSimulatedLocation(false);
        watchSubRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 4000,
            distanceInterval: 15,
          },
          (loc) => {
            handleLocationUpdate(
              loc.coords.latitude,
              loc.coords.longitude,
              loc.coords.speed,
              loc.coords.heading,
            );
          },
        );
      } else {
        setUsingSimulatedLocation(true);
        simIntervalRef.current = setInterval(simulateStep, 3000);
      }
    } catch (error) {
      console.error("Konum izleme başlatılamadı:", error);
      setUsingSimulatedLocation(true);
      simIntervalRef.current = setInterval(simulateStep, 3000);
    }
  };

  const stopLocationBroadcast = () => {
    watchSubRef.current?.remove();
    watchSubRef.current = null;
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
  };

  const handleStartTrip = async () => {
    if (!routeIdRef.current) {
      Alert.alert("Uyarı", "Başlatılacak geçerli bir rota bulunamadı.");
      return;
    }
    setConnecting(true);
    try {
      const token = await storageService.getToken();
      if (!token) {
        onLogout();
        return;
      }
      await startSignalRConnection(token);
      await joinRoute(routeIdRef.current);

      subscribeToPassengerActivity(
        (passengerId) =>
          setActivePassengers((prev) => [
            ...new Set([...prev, passengerId.toLowerCase()]),
          ]),
        (passengerId) =>
          setActivePassengers((prev) =>
            prev.filter((id) => id !== passengerId.toLowerCase()),
          ),
      );

      setTripActive(true);
      setElapsedSeconds(0);
      setCurrentStopIndex(0);
      setPathTraveled([]);
      driverCoordRef.current = null;
      setDriverCoord(null);
      hasFirstLocationRef.current = false;
      await startLocationBroadcast();
      setRouteTrigger((prev) => prev + 1);
    } catch (error) {
      Alert.alert("Hata", "Sefer başlatılamadı. Bağlantıyı kontrol edin.");
    } finally {
      setConnecting(false);
    }
  };

  const confirmEndTrip = () => {
    Alert.alert(
      "Seferi Bitir",
      "Bu seferi sonlandırmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Seferi Bitir", style: "destructive", onPress: handleEndTrip },
      ],
    );
  };

  const handleEndTrip = async () => {
    stopLocationBroadcast();
    await stopSignalRConnection();
    setTripActive(false);
    setUsingSimulatedLocation(false);
  };

  useEffect(() => {
    return () => {
      stopLocationBroadcast();
      stopSignalRConnection();
    };
  }, []);

  // 1. Rota Duraklarını Ayrıştırma (Başlangıç, Aktif Ara Duraklar, Varış)
  const { startPoint, endPoint, activeIntermediateStops, navStops } = useMemo(() => {
    const stops = routeData?.stops;
    if (!stops || stops.length === 0) {
      return {
        startPoint: null,
        endPoint: null,
        activeIntermediateStops: EMPTY_STOPS,
        navStops: EMPTY_STOPS,
      };
    }

    const start = stops[0];
    const end = stops.length > 1 ? stops[stops.length - 1] : null;

    // Ara durakları filtrele
    const rawIntermediates = stops.length > 2 ? stops.slice(1, -1) : [];
    const activeOnly = rawIntermediates.filter((s) =>
      activePassengers.includes(s.passengerId?.toLowerCase() || ""),
    );

    const origin = driverCoordRef.current ?? {
      latitude: start.latitude,
      longitude: start.longitude,
    };
    const orderedIntermediates = orderStopsByProximity(origin, activeOnly);

    // Sıralı navigasyon zinciri: Aktif Ara Duraklar + Varış Noktası
    const targetStops = [
      ...orderedIntermediates,
      ...(end ? [end] : orderedIntermediates.length === 0 ? [start] : []),
    ];

    return {
      startPoint: start,
      endPoint: end,
      activeIntermediateStops: orderedIntermediates,
      navStops: targetStops,
    };
  }, [routeData?.stops, activePassengers]);

  const safeStopIndex = Math.min(
    currentStopIndex,
    Math.max(navStops.length - 1, 0),
  );

  const handleAdvanceStop = (index: number) => {
    if (!tripActive) {
      Alert.alert("Uyarı", "Durak işaretlemek için önce seferi başlatın.");
      return;
    }
    if (index !== safeStopIndex || navStops.length === 0) return;
    if (index === navStops.length - 1) {
      Alert.alert(
        "Son Durak",
        "Son durağa ulaştınız. Seferi bitirmek ister misiniz?",
        [
          { text: "Hayır", style: "cancel" },
          {
            text: "Seferi Bitir",
            onPress: () => {
              setCurrentStopIndex((i) => i + 1);
              handleEndTrip();
            },
          },
        ],
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStopIndex((i) => i + 1);
  };

  // 2. OpenRouteService Polyline Senkronizasyonu
  useEffect(() => {
    if (!startPoint || navStops.length === 0) {
      setRouteCoordinates((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const origin = driverCoordRef.current
      ? { latitude: driverCoordRef.current.latitude, longitude: driverCoordRef.current.longitude }
      : { latitude: startPoint.latitude, longitude: startPoint.longitude };

    const remainingStops = navStops.slice(safeStopIndex);

    const dynamicStops: Coordinate[] = [
      origin,
      ...remainingStops.map((s) => ({
        latitude: s.latitude,
        longitude: s.longitude,
      })),
    ];

    if (dynamicStops.length >= 2) {
      const requestId = ++routeRequestIdRef.current;
      mapService.getRoutePolyline(dynamicStops).then((coords) => {
        if (requestId === routeRequestIdRef.current && coords.length > 0) {
          setRouteCoordinates(coords);
        }
      });
    }
  }, [startPoint, navStops, safeStopIndex, routeTrigger]);

  const occupancy = Math.min(
    activePassengers.length,
    routeData?.capacity || activePassengers.length,
  );
  const occupancyPct = routeData?.capacity ? occupancy / routeData.capacity : 0;
  const nextStop = navStops[safeStopIndex];
  const mapCenter = routeData?.stops?.[0]
    ? {
        latitude: routeData.stops[0].latitude,
        longitude: routeData.stops[0].longitude,
      }
    : { latitude: 41.0082, longitude: 28.9784 };

  if (showRouteSelect) {
    return (
      <View style={selectStyles.container}>
        <View style={selectStyles.topBar}>
          <View style={selectStyles.topBarLeft}>
            <Ionicons name="bus" size={22} color="#1E4ED8" />
            <Text style={selectStyles.appName}>Servisini Seç</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {routeData && (
              <TouchableOpacity
                style={selectStyles.iconButton}
                onPress={() => setShowRouteSelect(false)}
              >
                <Feather name="x" size={20} color="#111827" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={selectStyles.iconButton}
              onPress={onLogout}
            >
              <Feather name="log-out" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {loadingRoutes ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={{ marginTop: 100 }}
          />
        ) : availableRoutes.length === 0 ? (
          <View style={selectStyles.emptyBox}>
            <Feather name="info" size={24} color="#9CA3AF" />
            <Text style={selectStyles.emptyText}>
              Size atanmış bir servis bulunamadı.
            </Text>
          </View>
        ) : (
          <ScrollView style={selectStyles.list}>
            {availableRoutes.map((route) => (
              <TouchableOpacity
                key={route.routeId}
                style={selectStyles.routeCard}
                onPress={() => handleSelectRouteFromList(route.routeId)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={selectStyles.routeName}>{route.name}</Text>
                  <Text style={selectStyles.routePlate}>
                    Plaka: {route.plate}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#2563EB" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: mapCenter.latitude,
          longitude: mapCenter.longitude,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        }}
        onMapReady={() => setIsMapReady(true)}
        showsUserLocation={!usingSimulatedLocation}
        showsMyLocationButton={false}
      >
        {/* ORS Rota Çizgisi */}
        {isMapReady && routeCoordinates.length > 1 && (
          <Polyline
            key={`route-polyline-${routeCoordinates.length}`}
            coordinates={routeCoordinates}
            strokeColor="#1E4ED8"
            strokeWidth={5}
            zIndex={999}
            lineJoin="round"
          />
        )}

        {/* Kat Edilen Yol */}
        {isMapReady && pathTraveled.length > 1 && (
          <Polyline
            key="traveled-line"
            coordinates={pathTraveled}
            strokeColor="#60A5FA"
            strokeWidth={3}
          />
        )}

        {/* 1. Başlangıç Noktası (Yeşil Pin) */}
        {isMapReady && startPoint && (
          <Marker
            key="route-start-marker"
            coordinate={{
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
            }}
            title="Başlangıç Noktası"
            description={startPoint.label}
            pinColor="#10B981"
          />
        )}

        {/* 2. Ara Yolcu Durakları (Turuncu / Gri Pin) */}
        {isMapReady &&
          activeIntermediateStops.map((stop, i) => (
            <Marker
              key={`intermediate-stop-${stop.id}`}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.label}
              description={stop.time}
              pinColor={i < safeStopIndex ? "#94A3B8" : "#F59E0B"}
            />
          ))}

        {/* 3. Varış Noktası (Kırmızı Pin) */}
        {isMapReady && endPoint && (
          <Marker
            key="route-end-marker"
            coordinate={{
              latitude: endPoint.latitude,
              longitude: endPoint.longitude,
            }}
            title="Varış Noktası (Şirket)"
            description={endPoint.label}
            pinColor="#EF4444"
          />
        )}

        {/* 4. Şoförün Canlı Konumu (Mavi Pin) */}
        {isMapReady && driverCoord && (
          <Marker
            key="driver-current-marker"
            coordinate={driverCoord}
            title="Araç Konumu"
            description="Canlı konum"
            pinColor="#2563EB"
          />
        )}
      </MapView>

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.brandChip}
          onPress={() => {
            if (availableRoutes.length > 1 && !tripActive) {
              setShowRouteSelect(true);
            }
          }}
          disabled={tripActive}
        >
          <Ionicons name="bus-outline" size={18} color="#1D4ED8" />
          <Text style={styles.brandText}>
            {routeData?.name || "Rota bekleniyor"}
          </Text>
          {availableRoutes.length > 1 && !tripActive && (
            <Feather
              name="chevron-down"
              size={16}
              color="#1D4ED8"
              style={{ marginLeft: 4 }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { height: sheetExpanded ? "76%" : "46%" }]}>
        <TouchableOpacity
          style={styles.dragHandleContainer}
          onPress={toggleSheet}
        >
          <View style={styles.dragHandle} />
        </TouchableOpacity>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {routeData?.number || "SRV"}
                  </Text>
                </View>
                <Text style={styles.statusText}>
                  {tripActive ? "Aktif" : "Hazır"}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    tripActive && styles.statusDotActive,
                  ]}
                />
              </View>
              <Text style={styles.title}>
                {routeData?.name || "Kayıtlı aktif rota yok"}
              </Text>
            </View>
            <View style={styles.capacityBox}>
              <Text
                style={[
                  styles.capacityValue,
                  { color: occupancyPct > 0.8 ? "#EF4444" : "#22C55E" },
                ]}
              >
                {occupancy}
              </Text>
              <Text style={styles.capacityLabel}>
                {routeData?.capacity || 0}
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Toplam süre</Text>
              <Text style={styles.summaryValue}>
                {formatElapsed(elapsedSeconds)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sonraki durak</Text>
              <Text style={styles.summaryValue}>
                {nextStop?.label || "Bekleniyor"}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Araç</Text>
              <Text style={styles.summaryValue}>
                {routeData?.vehicleModel || "Bilgi Yok"}
              </Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                connecting && styles.primaryButtonDisabled,
              ]}
              onPress={handleStartTrip}
              disabled={connecting || tripActive}
            >
              <Text style={styles.primaryButtonText}>
                {connecting
                  ? "Bağlanıyor..."
                  : tripActive
                    ? "Sefer Aktif"
                    : "Seferi Başlat"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={confirmEndTrip}
              disabled={!tripActive}
            >
              <Text style={styles.secondaryButtonText}>Bitir</Text>
            </TouchableOpacity>
          </View>

          {routeData && routeData.stops.length > 0 ? (
            <View style={styles.stopList}>
              <Text style={styles.sectionTitle}>
                DURAKLAR (SADECE AKTİF YOLCULAR)
              </Text>
              {routeData.stops.map((stop, i) => {
                const isStart = i === 0;
                const isEnd = i === routeData.stops.length - 1;
                const isActive =
                  isStart ||
                  isEnd ||
                  activePassengers.includes(stop.passengerId?.toLowerCase() || "");

                return (
                  <TouchableOpacity
                    key={stop.id}
                    style={[styles.stopItem, !isActive && { opacity: 0.4 }]}
                    onPress={() => handleAdvanceStop(i)}
                    disabled={!tripActive || !isActive}
                  >
                    <View style={styles.stopMarkerContainer}>
                      <View
                        style={[
                          styles.stopMarker,
                          i < currentStopIndex && styles.stopMarkerPassed,
                          i === currentStopIndex && styles.stopMarkerCurrent,
                        ]}
                      />
                      {i < routeData.stops.length - 1 && (
                        <View style={styles.stopConnector} />
                      )}
                    </View>
                    <View style={styles.stopTextWrap}>
                      <Text style={styles.stopName}>
                        {isStart
                          ? `[Başlangıç] ${stop.label}`
                          : isEnd
                            ? `[Varış] ${stop.label}`
                            : `${stop.label} ${!isActive ? "(Bağlı Değil)" : ""}`}
                      </Text>
                      <Text style={styles.stopTime}>{stop.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>
                Size atanmış aktif bir rota bulunamadı. Lütfen yöneticinizin bir
                atama yapmasını bekleyin.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {tripActive && (
        <View style={styles.bottomActionBar}>
          <View style={styles.countText}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
              {occupancy}/{routeData?.capacity || 0}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2E8F0" },
  topBar: {
    position: "absolute",
    top: 54,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  brandText: { color: "#0F172A", fontWeight: "700" },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  logoutText: { fontWeight: "700", color: "#DC2626" },
  sheet: {
    position: "absolute",
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandleContainer: { alignItems: "center", paddingVertical: 12 },
  dragHandle: {
    width: 42,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  badge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: { color: "#1D4ED8", fontSize: 10, fontWeight: "700" },
  statusText: { color: "#475569", fontSize: 12 },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginLeft: 6,
  },
  statusDotActive: { backgroundColor: "#22C55E" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  capacityBox: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 10,
    minWidth: 68,
  },
  capacityValue: { fontSize: 18, fontWeight: "800" },
  capacityLabel: { fontSize: 11, color: "#64748B" },
  summaryCard: { backgroundColor: "#F8FAFC", borderRadius: 18, padding: 14 },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: { color: "#475569", fontSize: 12 },
  summaryValue: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
  controlsRow: { flexDirection: "row", marginTop: 18 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: {
    flex: 0.45,
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#0F172A", fontWeight: "800" },
  stopList: { marginTop: 22 },
  sectionTitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  stopItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  stopMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    marginRight: 12,
  },
  stopMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CBD5E1",
  },
  stopMarkerPassed: { backgroundColor: "#94A3B8" },
  stopMarkerCurrent: {
    backgroundColor: "#2563EB",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopConnector: {
    width: 2,
    height: 18,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
  },
  stopTextWrap: { flex: 1 },
  stopName: { color: "#0F172A", fontWeight: "700" },
  stopTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  emptyStateBox: {
    marginTop: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
  },
  emptyStateText: { color: "#475569", fontSize: 13, lineHeight: 20 },
  bottomActionBar: {
    position: "absolute",
    bottom: 132,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    width: 72,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#fff",
    marginHorizontal: 14,
    borderRadius: 12,
    paddingVertical: 10,
  },
});

const selectStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9", paddingTop: 60 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  appName: { fontWeight: "800", color: "#111827", fontSize: 18 },
  iconButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  list: { paddingHorizontal: 20 },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  routeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  routePlate: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 10,
    fontSize: 14,
  },
});