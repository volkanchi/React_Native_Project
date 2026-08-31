import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { routeService } from '../services/routeService';
import { storageService } from '../services/storageService';

export default function SelectStopScreen({ route, navigation }: any) {
  // PassengerMainScreen'den gelen veriler
  const { routeCode, routeName, pathCoordinates } = route.params;
  
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [loading, setLoading] = useState(false);

  // Haritayı, rotanın ilk noktasına (veya varsayılan İstanbul'a) ortala
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
      // ASIL KAYIT İŞLEMİ BURADA YAPILIYOR (Seçilen konum ile birlikte)
      const res = await routeService.joinRoute({
        routeCode: routeCode,
        location: selectedLocation
      }, token);

      if (res.success) {
        Alert.alert("Başarılı", "Servis güzergahına başarıyla dahil oldunuz!");
        navigation.navigate("PassengerMain"); // Ana ekrana geri dön (Listesi yenilenecek)
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
        // Haritaya tıklanınca pin koy
        onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
      >
        {/* Güzergah Çizgisi */}
        {pathCoordinates && pathCoordinates.length > 1 && (
          <Polyline coordinates={pathCoordinates} strokeColor="#2563EB" strokeWidth={4} />
        )}

        {/* Kullanıcının Koyduğu Pin */}
        {selectedLocation && (
          <Marker coordinate={selectedLocation} pinColor="#10B981" title="Biniş Noktam" />
        )}
      </MapView>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Feather name="arrow-left" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.bottomSheet}>
        <Text style={styles.title}>{routeName}</Text>
        <Text style={styles.subtitle}>Lütfen haritaya dokunarak bineceğiniz noktayı işaretleyin.</Text>

        <TouchableOpacity 
          style={[styles.confirmButton, !selectedLocation && { opacity: 0.5 }]} 
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
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});