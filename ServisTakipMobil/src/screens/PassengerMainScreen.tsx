import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";
import { routeService } from "../services/routeService";
import { storageService } from "../services/storageService";
import ProfileUpdateModal from "../components/ProfileUpdateModal";


interface PassengerMainScreenProps {
  user: any;
  onNavigateToLiveTracking: (routeId: string) => void;
  onNavigateToSelectStop: (routeCode: string, routeName: string, pathCoords: any[]) => void; // BUNU EKLEYİN
  onLogout: () => void;
}

export default function PassengerMainScreen({ 
  onNavigateToLiveTracking, 
  onNavigateToSelectStop, 
  onLogout 
}: PassengerMainScreenProps) {
  const [routeCode, setRouteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingRoutes, setFetchingRoutes] = useState(true);
  const [myRoutes, setMyRoutes] = useState<any[]>([]);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // 1. Ekran açıldığında rotaları otomatik çek
  useEffect(() => {
    loadMyRoutes();
  }, []);

  const loadMyRoutes = async () => {
    setFetchingRoutes(true);
    const token = await storageService.getToken();
    if (!token) return;

    const res = await routeService.getMyRoutes(token);
    if (res.success && res.data) {
      setMyRoutes(res.data);
    }
    setFetchingRoutes(false);
  };

  // 2. Yeni rotaya (odaya) katıl
  // 2. Rota kodunu gönderip önizleme (çizgi) verisini al ve Harita ekranına git
  const handlePreviewRoute = async () => {
    if (!routeCode.trim()) return Alert.alert('Uyarı', 'Lütfen bir rota kodu giriniz.');
    
    setLoading(true);
    const token = await storageService.getToken();
    if (!token) return;

    // Direkt katılmak yerine önizleme verisini (harita çizgisini) çekiyoruz
    const result = await routeService.previewRoute(routeCode.trim(), token);
    
    if (result.success && result.data) {
      setRouteCode('');
      // Navigasyon ile kullanıcıyı Durak Seçim Haritasına yolluyoruz
      onNavigateToSelectStop(routeCode.trim(), result.data.name, result.data.pathCoordinates);
    } else {
      Alert.alert('Hata', result.message || 'Rota bulunamadı.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Arka Plan Haritası (Süs Niyetine) */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 41.0082,
          longitude: 28.9784,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      />

      {/* Üst Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="bus" size={24} color="#1E4ED8" />
          <Text style={styles.appName}>ServisTakip</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* PROFIL BUTONU */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsProfileModalVisible(true)}
          >
            <Feather name="user" size={20} color="#2563EB" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
            <Feather name="log-out" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alt Beyaz Panel */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Servislerim</Text>

        {/* Rota Listesi */}
        <ScrollView
          style={styles.routeList}
          showsVerticalScrollIndicator={false}
        >
          {fetchingRoutes ? (
            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={{ marginTop: 20 }}
            />
          ) : myRoutes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="info" size={24} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                Henüz bir servise kayıtlı değilsiniz. Aşağıdan kod ile
                katılabilirsiniz.
              </Text>
            </View>
          ) : (
            myRoutes.map((route) => (
              <View key={route.id} style={styles.routeCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeDriver}>
                    Şoför: {route.driverName}
                  </Text>
                  <Text style={styles.routePlate}>Plaka: {route.plate}</Text>
                </View>
                <TouchableOpacity
                  style={styles.watchButton}
                  onPress={() => onNavigateToLiveTracking(route.id)}
                >
                  <Feather name="map-pin" size={16} color="#fff" />
                  <Text style={styles.watchButtonText}>İzle</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Yeni Servise Katılma Alanı */}
        <View style={styles.joinArea}>
          <Text style={styles.joinTitle}>Yeni Servise Katıl</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.input}
              placeholder="Rota Kodu (Örn: 34ABC123)"
              value={routeCode}
              onChangeText={setRouteCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handlePreviewRoute}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Katıl</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ProfileUpdateModal 
        visible={isProfileModalVisible} 
        onClose={() => setIsProfileModalVisible(false)} 
        onProfileUpdated={() => {
           // Profil güncellendikten sonra yapılacak ekstra bir işlem varsa buraya yazılır.
        }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EDF4" },
  topBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  appName: { fontWeight: "bold", color: "#111827", fontSize: 16 },
  iconButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },

  routeList: { flex: 1 },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },

  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
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
  routeDriver: { fontSize: 13, color: "#475569", marginBottom: 2 },
  routePlate: { fontSize: 13, color: "#2563EB", fontWeight: "600" },

  watchButton: {
    flexDirection: "row",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    gap: 6,
  },
  watchButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  joinArea: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 10,
  },
  joinRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: "#111827",
  },
  joinButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  joinButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
