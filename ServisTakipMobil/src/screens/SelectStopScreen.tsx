import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { routeService } from '../services/routeService';
import { storageService } from '../services/storageService';
import { mapService, Coordinate } from '../services/mapService'; // Servis dahil edildi

export default function SelectStopScreen({ route, navigation }: any) {
  const { routeCode, routeName, pathCoordinates } = route.params;
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<Coordinate[]>([]);
  const [calculatingRoute, setCalculatingRoute] = useState(true);

  // Gelen ham durak noktalarını ORS üzerinden gerçek cadde çizgisine dönüştür
  useEffect(() => {
    let isMounted = true;

    const fetchRealStreetPath = async () => {
      if (pathCoordinates && pathCoordinates.length >= 2) {
        setCalculatingRoute(true);
        // Ham koordinatları backend proxy'si üzerinden ORS'ye gönderiyoruz
        const realCoords = await mapService.getRoutePolyline(pathCoordinates);
        if (isMounted) {
          setRoutePolyline(realCoords);
          setCalculatingRoute(false);
        }
      } else {
        setCalculatingRoute(false);
      }
    };

    fetchRealStreetPath();

    return () => {
      isMounted = false;
    };
  }, [pathCoordinates]);

  const initialRegion = pathCoordinates && pathCoordinates.length > 0
    ? { latitude: pathCoordinates[0].latitude, longitude: pathCoordinates[0].longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  const handleJoin = async () => {
    if (!selectedLocation) {
      Alert.alert("Uyarı", "Lütfen haritaya dokunarak bineceğiniz yeri işaretleyin.");
      return;
    }
    setLoading(true);
    const token = await storageService.getToken();
    if (token) {
      const res = await routeService.joinRoute({
        routeCode: routeCode,
        location: selectedLocation
      }, token);
      if (res.success) {
        Alert.alert("Başarılı", "Servis güzergahına başarıyla dahil oldunuz!");
        navigation.navigate("PassengerMain");
      } else {
        Alert.alert("Hata", res.message || "Katılım başarısız.");
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
      >
        {/* ORS'den dönen gerçek cadde/otoyol güzergahı */}
        {routePolyline.length > 1 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#2563EB"
            strokeWidth={4}
            zIndex={999}
            lineJoin="round"
          />
        )}

        {/* Kullanıcının biniş noktası olarak seçtiği pin */}
        {selectedLocation && (
          <Marker coordinate={selectedLocation} pinColor="#10B981" title="Biniş Noktam" />
        )}
      </MapView>

      {calculatingRoute && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Güzergah hesaplanıyor...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <Text style={styles.title}>{routeName}</Text>
        <Text style={styles.subtitle}>Lütfen haritaya dokunarak bineceğiniz noktayı işaretleyin.</Text>
        <TouchableOpacity
          style={[styles.confirmButton, (!selectedLocation || loading) && { opacity: 0.5 }]}
          onPress={handleJoin}
          disabled={!selectedLocation || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Buradan Bineceğim</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: '#fff', padding: 10, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20 },
  confirmButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingBadge: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: { fontSize: 12, fontWeight: '600', color: '#1E4ED8' },
});