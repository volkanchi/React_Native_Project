import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  AppState,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Feather, Ionicons } from "@expo/vector-icons";
import { storageService } from "../services/storageService";
import { routeService } from "../services/routeService";
import {
  startSignalRConnection,
  stopSignalRConnection,
  sendLocationUpdate,
  subscribeToPassengerActivity,
} from "../services/signalrService";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface DriverMainScreenProps {
  onLogout: () => void;
}

export default function DriverMainScreen({ onLogout }: DriverMainScreenProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [occupancy, setOccupancy] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [routeData, setRouteData] = useState<RouteState | null>(null);
  const [driverCoord, setDriverCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pathTraveled, setPathTraveled] = useState<{ latitude: number; longitude: number }[]>([]);
  const [usingSimulatedLocation, setUsingSimulatedLocation] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Aktif yolcuları tutan state
  const [activePassengers, setActivePassengers] = useState<string[]>([]);

  const watchSubRef = useRef<Location.LocationSubscription | null>(null);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeIdRef = useRef<string>("");

  const toggleSheet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetExpanded((value) => !value);
  };

  // 1. Ekran açıldığında Backend'den gerçek rotayı çek
  useEffect(() => {
    loadRouteData();
  }, []);

  const loadRouteData = async () => {
    const token = await storageService.getToken();
    if (!token) return;

    const res = await routeService.getDriverRoute(token);
    if (res.success && res.data) {
      routeIdRef.current = res.data.routeId; // Backend'den gelen Guid
      setRouteData({
        routeId: res.data.routeId,
        name: res.data.name,
        number: "SRV", 
        routeCode: res.data.routeCode,
        plate: res.data.plate,
        vehicleModel: res.data.vehicleModel,
        capacity: res.data.capacity,
        stops: res.data.stops.map((s: any) => ({
          id: s.id,
          passengerId: s.passengerId,
          label: s.label,
          time: s.time,
          latitude: s.latitude,
          longitude: s.longitude
        }))
      });
    } else {
      setRouteData(null);
    }
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

  const handleLocationUpdate = (lat: number, lng: number, speed?: number | null, heading?: number | null) => {
    const coord = { latitude: lat, longitude: lng };
    setDriverCoord(coord);
    setPathTraveled((prev) => [...prev.slice(-200), coord]);

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
      const base = prev ?? { latitude: target.latitude, longitude: target.longitude };
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
          { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 15 },
          (loc) => {
            handleLocationUpdate(loc.coords.latitude, loc.coords.longitude, loc.coords.speed, loc.coords.heading);
          }
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
      Alert.alert('Uyarı', 'Başlatılacak geçerli bir rota bulunamadı. Lütfen size araç ve rota atanmasını bekleyin.');
      return;
    }

    setConnecting(true);
    try {
      const token = await storageService.getToken();
      if (!token) {
        onLogout();
        return;
      }

      // SignalR bağlantısını başlat
      await startSignalRConnection(token);
      
      // Odaya katılan ve çıkan yolcuları state'e yaz
      subscribeToPassengerActivity(
        (passengerId) => setActivePassengers((prev) => [...new Set([...prev, passengerId])]),
        (passengerId) => setActivePassengers((prev) => prev.filter((id) => id !== passengerId))
      );
      
      setTripActive(true);
      setElapsedSeconds(0);
      setCurrentStopIndex(0);
      setPathTraveled([]);
      setDriverCoord(null);
      await startLocationBroadcast();
    } catch (error) {
      Alert.alert("Hata", "Sefer başlatılamadı. Bağlantınızı kontrol edin.");
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
      ]
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

  const handleAdvanceStop = (index: number) => {
    const routeStops = routeData?.stops ?? [];
    if (!tripActive) {
      Alert.alert("Uyarı", "Durak işaretlemek için önce seferi başlatın.");
      return;
    }
    if (index !== currentStopIndex || routeStops.length === 0) return;

    if (index === routeStops.length - 1) {
      Alert.alert("Son Durak", "Son durağa ulaştınız. Seferi bitirmek ister misiniz?", [
        { text: "Hayır", style: "cancel" },
        {
          text: "Seferi Bitir",
          onPress: () => {
            setCurrentStopIndex((i) => i + 1);
            handleEndTrip();
          },
        },
      ]);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStopIndex((i) => i + 1);
  };

  const adjustOccupancy = (delta: number) => {
    setOccupancy((prev) => Math.max(0, Math.min(routeData?.capacity || 0, prev + delta)));
  };

  const routeStops = routeData?.stops ?? [];
  const occupancyPct = routeData?.capacity ? occupancy / routeData.capacity : 0;
  const nextStop = routeStops[Math.min(currentStopIndex, Math.max(routeStops.length - 1, 0))];
  const mapCenter = routeStops[0]
    ? { latitude: routeStops[0].latitude, longitude: routeStops[0].longitude }
    : { latitude: 41.0082, longitude: 28.9784 };

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
        showsUserLocation={!usingSimulatedLocation}
        showsMyLocationButton={false}
      >
        {routeStops.length > 1 && (
          <Polyline
            coordinates={routeStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude }))}
            strokeColor="#CBD5E1"
            strokeWidth={4}
          />
        )}

        {pathTraveled.length > 1 && (
          <Polyline coordinates={pathTraveled} strokeColor="#1E4ED8" strokeWidth={4} />
        )}

        {routeStops.map((stop, i) => {
          // Eğer bu durağın yolcusu 'activePassengers' dizisinde yoksa haritaya pin basma
          if (!activePassengers.includes(stop.passengerId)) {
            return null;
          }

          return (
            <Marker
              key={stop.id}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.label}
              description={stop.time}
              pinColor={i < currentStopIndex ? "#94A3B8" : i === currentStopIndex ? "#1E4ED8" : "#22C55E"}
            />
          );
        })}

        {driverCoord && (
          <Marker coordinate={driverCoord} title="Araç Konumu" description="Canlı konum" pinColor="#2563EB" />
        )}
      </MapView>

      <View style={styles.topBar}>
        <View style={styles.brandChip}>
          <Ionicons name="bus-outline" size={18} color="#1D4ED8" />
          <Text style={styles.brandText}>{routeData?.name || "Rota bekleniyor"}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, { height: sheetExpanded ? "76%" : "46%" }]}>
        <TouchableOpacity style={styles.dragHandleContainer} onPress={toggleSheet}>
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{routeData?.number || "API"}</Text>
                </View>
                <Text style={styles.statusText}>{tripActive ? "Aktif" : "Hazır"}</Text>
                <View style={[styles.statusDot, tripActive && styles.statusDotActive]} />
              </View>
              <Text style={styles.title}>{routeData?.name || "Kayıtlı aktif rota yok"}</Text>
            </View>
            <View style={styles.capacityBox}>
              <Text style={[styles.capacityValue, { color: occupancyPct > 0.8 ? "#EF4444" : "#22C55E" }]}>
                {occupancy}
              </Text>
              <Text style={styles.capacityLabel}>{routeData?.capacity || 0}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Toplam süre</Text>
              <Text style={styles.summaryValue}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Sonraki durak</Text>
              <Text style={styles.summaryValue}>{nextStop?.label || "Bekleniyor"}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Araç</Text>
              <Text style={styles.summaryValue}>{routeData?.vehicleModel || "Bilgi Yok"}</Text>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, connecting && styles.primaryButtonDisabled]}
              onPress={handleStartTrip}
              disabled={connecting || tripActive}
            >
              <Text style={styles.primaryButtonText}>
                {connecting ? "Bağlanıyor..." : tripActive ? "Sefer açık" : "Seferi başlat"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={confirmEndTrip} disabled={!tripActive}>
              <Text style={styles.secondaryButtonText}>Bitir</Text>
            </TouchableOpacity>
          </View>

          {routeStops.length > 0 && (
            <View style={styles.stopList}>
              <Text style={styles.sectionTitle}>DURAKLAR (SADECE AKTİF YOLCULAR)</Text>
              {routeStops.map((stop, i) => {
                // Eğer yolcu uygulamada yayını izlemiyorsa Listede de soluk (pasif) gösterelim
                const isActive = activePassengers.includes(stop.passengerId);

                return (
                  <TouchableOpacity
                    key={stop.id}
                    style={[styles.stopItem, !isActive && { opacity: 0.4 }]} // Pasifse soluk yap
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
                      {i < routeStops.length - 1 && <View style={styles.stopConnector} />}
                    </View>
                    <View style={styles.stopTextWrap}>
                      <Text style={styles.stopName}>{stop.label} {!isActive && "(Bağlı Değil)"}</Text>
                      <Text style={styles.stopTime}>{stop.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!routeData && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>
                Size atanmış aktif bir rota bulunamadı. Lütfen firma yöneticinizin bir araç ve rota atamasını bekleyin.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {tripActive && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity style={styles.actionButton} onPress={() => adjustOccupancy(-1)}>
            <Feather name="minus" size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.countText}>{occupancy}</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => adjustOccupancy(1)}>
            <Feather name="plus" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E2E8F0" },
  topBar: { position: "absolute", top: 54, left: 18, right: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 3 },
  brandChip: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  brandText: { color: "#0F172A", fontWeight: "700" },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#fff" },
  logoutText: { fontWeight: "700", color: "#DC2626" },
  sheet: { position: "absolute", right: 0, left: 0, bottom: 0, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  dragHandleContainer: { alignItems: "center", paddingVertical: 12 },
  dragHandle: { width: 42, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  badge: { backgroundColor: "#DBEAFE", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { color: "#1D4ED8", fontSize: 10, fontWeight: "700" },
  statusText: { color: "#475569", fontSize: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#CBD5E1", marginLeft: 6 },
  statusDotActive: { backgroundColor: "#22C55E" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  capacityBox: { alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, padding: 10, minWidth: 68 },
  capacityValue: { fontSize: 18, fontWeight: "800" },
  capacityLabel: { fontSize: 11, color: "#64748B" },
  summaryCard: { backgroundColor: "#F8FAFC", borderRadius: 18, padding: 14 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  summaryLabel: { color: "#475569", fontSize: 12 },
  summaryValue: { color: "#0F172A", fontSize: 13, fontWeight: "700" },
  controlsRow: { flexDirection: "row", marginTop: 18 },
  primaryButton: { flex: 1, backgroundColor: "#2563EB", borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "800" },
  secondaryButton: { flex: 0.45, backgroundColor: "#E2E8F0", borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: "#0F172A", fontWeight: "800" },
  stopList: { marginTop: 22 },
  sectionTitle: { fontSize: 12, color: "#64748B", fontWeight: "700", letterSpacing: 1, marginBottom: 12 },
  stopItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  stopMarkerContainer: { alignItems: "center", justifyContent: "center", width: 18, marginRight: 12 },
  stopMarker: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#CBD5E1" },
  stopMarkerPassed: { backgroundColor: "#94A3B8" },
  stopMarkerCurrent: { backgroundColor: "#2563EB", width: 12, height: 12, borderRadius: 6 },
  stopConnector: { width: 2, height: 18, backgroundColor: "#E2E8F0", marginTop: 4 },
  stopTextWrap: { flex: 1 },
  stopName: { color: "#0F172A", fontWeight: "700" },
  stopTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  emptyStateBox: { marginTop: 18, backgroundColor: "#F8FAFC", borderRadius: 16, padding: 14 },
  emptyStateText: { color: "#475569", fontSize: 13, lineHeight: 20 },
  bottomActionBar: { position: "absolute", bottom: 132, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  actionButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  countText: { width: 72, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#0F172A", backgroundColor: "#fff", marginHorizontal: 14, borderRadius: 12, paddingVertical: 10 },
});