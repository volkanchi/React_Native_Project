import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { routeService } from "../services/routeService";
import { storageService } from "../services/storageService";

interface DriverServiceSelectScreenProps {
  onSelectRoute: (routeId: string) => void;
  onLogout: () => void;
}

export default function DriverServiceSelectScreen({
  onSelectRoute,
  onLogout,
}: DriverServiceSelectScreenProps) {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    const token = await storageService.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const res = await routeService.getDriverRoutes(token);
    if (res.success && Array.isArray(res.data)) {
      setRoutes(res.data);
      if (res.data.length === 1) {
        onSelectRoute(res.data[0].routeId);
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="bus" size={22} color="#1E4ED8" />
          <Text style={styles.appName}>Servisini Seç</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
          <Feather name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 100 }} />
      ) : routes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="info" size={24} color="#9CA3AF" />
          <Text style={styles.emptyText}>Size atanmış bir servis bulunamadı.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {routes.map((route) => (
            <TouchableOpacity
              key={route.routeId}
              style={styles.routeCard}
              onPress={() => onSelectRoute(route.routeId)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.routeName}>{route.name}</Text>
                <Text style={styles.routePlate}>Plaka: {route.plate}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#2563EB" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  routeName: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  routePlate: { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: { textAlign: "center", color: "#6B7280", marginTop: 10, fontSize: 14 },
});