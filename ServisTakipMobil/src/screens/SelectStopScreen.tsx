import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather, Ionicons } from '@expo/vector-icons';
import { routeService } from '../services/routeService';
import { storageService } from '../services/storageService';
import { mapService, Coordinate } from '../services/mapService';

interface StopPreview {
  label?: string;
  latitude: number;
  longitude: number;
}

export default function SelectStopScreen({ route, navigation }: any) {
  const { routeCode, routeName, pathCoordinates, existingStops = [] } = route.params;

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<Coordinate[]>([]);
  const [calculatingRoute, setCalculatingRoute] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRealStreetPath = async () => {
      if (pathCoordinates && pathCoordinates.length >= 2) {
        setCalculatingRoute(true);
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
    ? {
        latitude: pathCoordinates[0].latitude,
        longitude: pathCoordinates[0].longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : { latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.08, longitudeDelta: 0.08 };

  const handleJoin = async () => {
    if (!selectedLocation) {
      Alert.alert('Uyarı', 'Lütfen haritaya dokunarak veya mevcut bir durağı seçerek bineceğiniz yeri belirleyin.');
      return;
    }
    setLoading(true);
    const token = await storageService.getToken();
    if (token) {
      const res = await routeService.joinRoute(
        {
          routeCode: routeCode,
          location: selectedLocation,
        },
        token
      );
      if (res.success) {
        Alert.alert('Başarılı', 'Servis güzergahına başarıyla dahil oldunuz!');
        navigation.navigate('PassengerMain');
      } else {
        Alert.alert('Hata', res.message || 'Katılım başarısız.');
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
        {/* ORS Rota Çizgisi */}
        {routePolyline.length > 1 && (
          <Polyline
            coordinates={routePolyline}
            strokeColor="#2563EB"
            strokeWidth={4}
            zIndex={1}
            lineJoin="round"
          />
        )}

        {/* 1. Hali Hazırda Kayıtlı Yolcuların Durakları (Mavi Pinler) */}
        {existingStops.map((stop: StopPreview, idx: number) => (
          <Marker
            key={`existing-stop-${idx}-${stop.latitude}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            pinColor="#3B82F6"
            title={stop.label || `Mevcut Durak ${idx + 1}`}
            description="Bu noktadan binmek için dokunun"
            onPress={() => {
              setSelectedLocation({
                latitude: stop.latitude,
                longitude: stop.longitude,
              });
            }}
          />
        ))}

        {/* 2. Kullanıcının Kendi Seçtiği Biniş Noktası (Yeşil Pin) */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            pinColor="#10B981"
            title="Biniş Noktam"
            description="Seçilen durak"
            zIndex={999}
          />
        )}
      </MapView>

      {/* Rota Hesaplanıyor Rozeti */}
      {calculatingRoute && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Güzergah haritası yükleniyor...</Text>
        </View>
      )}

      {/* Geri Dön Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#111827" />
      </TouchableOpacity>

      {/* Bilgilendirici Durak Rozeti (Legend) */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Mevcut Duraklar ({existingStops.length})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Benim Biniş Noktam</Text>
        </View>
      </View>

      {/* Alt Katılım Paneli */}
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>{routeName}</Text>
        <Text style={styles.subtitle}>
          Haritada boş bir yere dokunabilir veya mavi pinlerden birini seçerek ortak duraktan binebilirsiniz.
        </Text>

        <TouchableOpacity
          style={[styles.confirmButton, (!selectedLocation || loading) && { opacity: 0.5 }]}
          onPress={handleJoin}
          disabled={!selectedLocation || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>
                {selectedLocation ? 'Bu Duraktan Bineceğim' : 'Lütfen Bir Nokta Seçin'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
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
    zIndex: 10,
  },
  loadingText: { fontSize: 12, fontWeight: '600', color: '#1E4ED8' },
  legendContainer: {
    position: 'absolute',
    top: 105,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },
  confirmButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});