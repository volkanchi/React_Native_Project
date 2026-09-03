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
import {
  ServiceDirection,
  RouteAnchor,
  PassengerWaypoint,
  ServiceRouteModel,
} from "../types/routeTracking.types";

const EMPTY_WAYPOINTS: PassengerWaypoint[] = [];

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

// Gelen backend verisini katı Origin/Destination/Waypoint modeline normalize eder
const normalizeServiceRoute = (raw: any): ServiceRouteModel => {
  const routeName = raw.name || "Servis Güzergahı";
  const nameParts = routeName.includes("-")
    ? routeName.split("-")
    : [routeName, "Merkez"];

  // 1. Sabit Başlangıç Noktası (Örn: Bahçelievler Depo)
  const origin: RouteAnchor = {
    label:
      raw.startPointName ||
      raw.startAddress ||
      `${nameParts[0].trim()} Başlangıç`,
    latitude: Number(raw.startLatitude || raw.origin?.latitude || 41.0025),
    longitude: Number(raw.startLongitude || raw.origin?.longitude || 28.8612),
  };

  // 2. Sabit Bitiş Noktası (Örn: Kasımpaşa Şirket Ofisi)
  const destination: RouteAnchor = {
    label:
      raw.endPointName ||
      raw.endAddress ||
      `${nameParts[1]?.trim() || "Şirket"} Varış`,
    latitude: Number(raw.endLatitude || raw.destination?.latitude || 41.0365),
    longitude: Number(
      raw.endLongitude || raw.destination?.longitude || 28.9685,
    ),
  };

  // 3. Yolcu Durakları (Kesinlikle sadece gerçek yolcular)
  const waypoints: PassengerWaypoint[] = (raw.stops || [])
    .filter((s: any) => s.passengerId && String(s.passengerId).trim() !== "")
    .map((s: any, idx: number) => ({
      id: s.id ?? idx,
      passengerId: String(s.passengerId).toLowerCase(),
      label: s.passengerName || s.label || `Yolcu ${idx + 1}`,
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
  // Servis Yönü (Saat 13:00'ten önceyse Sabah, sonraysa Akşam moduyla başlar)
  const [direction, setDirection] = useState<ServiceDirection>(() =>
    new Date().getHours() >= 13 ? "EVENING" : "MORNING",
  );

  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [showRouteSelect, setShowRouteSelect] = useState(false);

  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeData, setRouteData] = useState<ServiceRouteModel | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const driverCoordRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const routeRequestIdRef = useRef(0);
  const [driverCoord, setDriverCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pathTraveled, setPathTraveled] = useState<
    { latitude: number; longitude: number }[]
  >([]);
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

  const loadRouteDetail = async (
    routeIdParam?: string,
    tokenParam?: string,
  ) => {
    const token = tokenParam || (await storageService.getToken());
    if (!token) return;

    const res = await routeService.getDriverRoute(token, routeIdParam);
    if (res.success && res.data) {
      routeIdRef.current = res.data.routeId;
      const normalized = normalizeServiceRoute(res.data);
      setRouteData(normalized);
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

  // Zamanlayıcı
  useEffect(() => {
    if (tripActive) {
      timerIntervalRef.current = setInterval(
        () => setElapsedSeconds((s) => s + 1),
        1000,
      );
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

    if (!routeIdRef.current) return;
    sendLocationUpdate({
      routeId: routeIdRef.current,
      latitude: lat,
      longitude: lng,
      speed: speed ?? undefined,
      heading: heading ?? undefined,
      direction,
    });
  };

  const simulateStep = () => {
    if (!activePlan) return;
    const target =
      activePlan.orderedWaypoints[
        Math.min(currentStopIndex, activePlan.orderedWaypoints.length - 1)
      ] || activePlan.arrival;
    setDriverCoord((prev) => {
      const base = prev ?? {
        latitude: activePlan.departure.latitude,
        longitude: activePlan.departure.longitude,
      };
      const nextLat = base.latitude + (target.latitude - base.latitude) * 0.25;
      const nextLng =
        base.longitude + (target.longitude - base.longitude) * 0.25;
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
      await startLocationBroadcast();
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

  // Yön Değiştirme Fonksiyonu
  const handleToggleDirection = (newDirection: ServiceDirection) => {
    if (tripActive) {
      Alert.alert(
        "Sefer Sürüyor",
        "Sefer devam ederken yön değiştiremezsiniz. Lütfen önce seferi bitirin.",
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDirection(newDirection);
    setCurrentStopIndex(0);
    setRouteCoordinates([]);
  };

  // Çift yön hesaplaması
  const activePlan = useMemo(() => {
    if (!routeData) return null;

    // Sabah: Origin -> Destination | Akşam: Destination -> Origin
    const isMorning = direction === "MORNING";
    const departure: RouteAnchor = isMorning
      ? routeData.origin
      : routeData.destination;
    const arrival: RouteAnchor = isMorning
      ? routeData.destination
      : routeData.origin;

    // Sadece aktif yolcuları filtrele
    const filteredWaypoints = routeData.waypoints.filter((w) =>
      activePassengers.includes(w.passengerId.toLowerCase()),
    );

    // Kalkış noktasına göre durakları optimize sırala
    const originCoord = driverCoordRef.current ?? {
      latitude: departure.latitude,
      longitude: departure.longitude,
    };
    const orderedWaypoints = orderStopsByProximity(
      originCoord,
      filteredWaypoints,
    );

    return {
      isMorning,
      departure,
      arrival,
      orderedWaypoints,
      allWaypoints: routeData.waypoints,
    };
  }, [routeData, direction, activePassengers]);

  const safeStopIndex = Math.min(
    currentStopIndex,
    Math.max((activePlan?.orderedWaypoints.length || 1) - 1, 0),
  );

  const handleAdvanceStop = (index: number) => {
    if (!tripActive) {
      Alert.alert("Uyarı", "Durak işaretlemek için önce seferi başlatın.");
      return;
    }
    if (!activePlan) return;

    if (index !== safeStopIndex) return;

    if (index === activePlan.orderedWaypoints.length - 1) {
      Alert.alert(
        "Son Durak",
        `Tüm yolcular tamamlandı. ${activePlan.arrival.label} noktasına geçiliyor. Seferi bitirmek ister misiniz?`,
        [
          { text: "Devam Et", style: "cancel" },
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

  // ORS Polyline: [Kalkış/Şoför] -> [Aktif Yolcular] -> [Varış]
  useEffect(() => {
    if (!activePlan) return;

    const remainingWaypoints = activePlan.orderedWaypoints.slice(safeStopIndex);

    const origin = driverCoordRef.current
      ? {
          latitude: driverCoordRef.current.latitude,
          longitude: driverCoordRef.current.longitude,
        }
      : {
          latitude: activePlan.departure.latitude,
          longitude: activePlan.departure.longitude,
        };

    const dynamicStops: Coordinate[] = [
      origin,
      ...remainingWaypoints.map((w) => ({
        latitude: w.latitude,
        longitude: w.longitude,
      })),
      {
        latitude: activePlan.arrival.latitude,
        longitude: activePlan.arrival.longitude,
      },
    ];

    if (dynamicStops.length >= 2) {
      const requestId = ++routeRequestIdRef.current;
      mapService.getRoutePolyline(dynamicStops).then((coords) => {
        if (
          requestId === routeRequestIdRef.current &&
          coords &&
          coords.length > 0
        ) {
          setRouteCoordinates(coords);
        }
      });
    }
  }, [activePlan, safeStopIndex, tripActive]);

  const occupancy = Math.min(
    activePassengers.length,
    routeData?.capacity || activePassengers.length,
  );
  const occupancyPct = routeData?.capacity ? occupancy / routeData.capacity : 0;
  const nextStopLabel =
    activePlan && activePlan.orderedWaypoints[safeStopIndex]
      ? activePlan.orderedWaypoints[safeStopIndex].label
      : activePlan?.arrival.label || "Varış Noktası";

  const mapCenter = activePlan
    ? {
        latitude: activePlan.departure.latitude,
        longitude: activePlan.departure.longitude,
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
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onMapReady={() => setIsMapReady(true)}
        showsUserLocation={!usingSimulatedLocation}
        showsMyLocationButton={false}
      >
        {/* Kesintisiz Sokak Güzergahı */}
        {isMapReady && routeCoordinates.length > 1 && (
          <Polyline
            key={`polyline-${direction}-${routeCoordinates.length}`}
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
            key="traveled-path"
            coordinates={pathTraveled}
            strokeColor="#60A5FA"
            strokeWidth={3}
          />
        )}

        {/* 1. Kalkış Noktası (Yeşil Pin - Sabah Depo, Akşam Şirket) */}
        {isMapReady && activePlan && (
          <Marker
            key={`start-${direction}`}
            coordinate={{
              latitude: activePlan.departure.latitude,
              longitude: activePlan.departure.longitude,
            }}
            title={`[Kalkış] ${activePlan.departure.label}`}
            pinColor="#10B981"
          />
        )}

        {/* 2. Aktif Yolcu Durakları (Marker Pinleri) */}
        {isMapReady &&
          activePlan &&
          activePlan.orderedWaypoints.map((stop, i) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.label}
              description={`Saat: ${stop.time}`}
              pinColor={i <= safeStopIndex ? "#F59E0B" : "#94A3B8"}
            />
          ))}

        {/* 3. Varış Noktası (Kırmızı Pin - Sabah Şirket, Akşam Depo) */}
        {isMapReady && activePlan && (
          <Marker
            key={`end-${direction}`}
            coordinate={{
              latitude: activePlan.arrival.latitude,
              longitude: activePlan.arrival.longitude,
            }}
            title={`[Varış] ${activePlan.arrival.label}`}
            pinColor="#EF4444"
          />
        )}

        {/* 4. Canlı Şoför Konumu (Mavi Pin) */}
        {isMapReady && driverCoord && (
          <Marker
            key="driver-pin"
            coordinate={driverCoord}
            title="Servis Aracı"
            description="Canlı Konum"
            pinColor="#2563EB"
          />
        )}
      </MapView>

      {/* Üst Bar & Servis Yön Seçici */}
      <View style={styles.topBarContainer}>
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

        {/* Çift Yönlü Shift Seçici (Sabah / Akşam) */}
        <View style={styles.shiftSelectorWrapper}>
          <TouchableOpacity
            style={[
              styles.shiftButton,
              direction === "MORNING" && styles.shiftButtonActive,
            ]}
            onPress={() => handleToggleDirection("MORNING")}
            disabled={tripActive}
          >
            <Ionicons
              name="sunny-outline"
              size={15}
              color={direction === "MORNING" ? "#fff" : "#475569"}
            />
            <Text
              style={[
                styles.shiftButtonText,
                direction === "MORNING" && styles.shiftButtonTextActive,
              ]}
            >
              Sabah (Gidiş)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shiftButton,
              direction === "EVENING" && styles.shiftButtonActive,
            ]}
            onPress={() => handleToggleDirection("EVENING")}
            disabled={tripActive}
          >
            <Ionicons
              name="moon-outline"
              size={15}
              color={direction === "EVENING" ? "#fff" : "#475569"}
            />
            <Text
              style={[
                styles.shiftButtonText,
                direction === "EVENING" && styles.shiftButtonTextActive,
              ]}
            >
              Akşam (Dönüş)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Alt Bilgi Paneli */}
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
              <Text style={styles.summaryLabel}>Sonraki hedef</Text>
              <Text style={styles.summaryValue}>{nextStopLabel}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sefer Tipi</Text>
              <Text style={styles.summaryValue}>
                {direction === "MORNING"
                  ? "İşe Gidiş (Toplama)"
                  : "Eve Dönüş (Dağıtım)"}
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

          {/* Dinamik ve Ayrıştırılmış Durak Listesi */}
          {activePlan && (
            <View style={styles.stopList}>
              <Text style={styles.sectionTitle}>
                {direction === "MORNING" ? "BİNİŞ DURAKLARI" : "İNİŞ DURAKLARI"}
              </Text>

              {/* Kalkış Noktası */}
              <View style={styles.stopItem}>
                <View style={styles.stopMarkerContainer}>
                  <View
                    style={[styles.stopMarker, { backgroundColor: "#10B981" }]}
                  />
                  <View style={styles.stopConnector} />
                </View>
                <View style={styles.stopTextWrap}>
                  <Text style={[styles.stopName, { color: "#10B981" }]}>
                    [Kalkış] {activePlan.departure.label}
                  </Text>
                </View>
              </View>

              {/* Ara Yolcu Durakları */}
              {activePlan.allWaypoints.map((stop, i) => {
                const isActive = activePassengers.includes(
                  stop.passengerId.toLowerCase(),
                );
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
                      <View style={styles.stopConnector} />
                    </View>
                    <View style={styles.stopTextWrap}>
                      <Text style={styles.stopName}>
                        {stop.label} {!isActive && "(Bağlı Değil)"}
                      </Text>
                      <Text style={styles.stopTime}>{stop.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Varış Noktası */}
              <View style={styles.stopItem}>
                <View style={styles.stopMarkerContainer}>
                  <View
                    style={[styles.stopMarker, { backgroundColor: "#EF4444" }]}
                  />
                </View>
                <View style={styles.stopTextWrap}>
                  <Text style={[styles.stopName, { color: "#EF4444" }]}>
                    [Varış] {activePlan.arrival.label}
                  </Text>
                </View>
              </View>
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
  topBarContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 3,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandText: { color: "#0F172A", fontWeight: "700" },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { fontWeight: "700", color: "#DC2626" },
  shiftSelectorWrapper: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shiftButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  shiftButtonActive: { backgroundColor: "#1E4ED8" },
  shiftButtonText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  shiftButtonTextActive: { color: "#fff" },
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
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
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
    marginBottom: 8,
  },
  summaryLabel: { color: "#475569", fontSize: 12 },
  summaryValue: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
  controlsRow: { flexDirection: "row", marginTop: 16 },
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
  stopList: { marginTop: 20 },
  sectionTitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  stopItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
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
    height: 16,
    backgroundColor: "#E2E8F0",
    marginTop: 4,
  },
  stopTextWrap: { flex: 1 },
  stopName: { color: "#0F172A", fontWeight: "700" },
  stopTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  bottomActionBar: {
    position: "absolute",
    bottom: 132,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  countText: {
    width: 72,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
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