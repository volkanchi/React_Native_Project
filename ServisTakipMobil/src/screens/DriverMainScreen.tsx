import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { locationService } from '../services/locationService';
import { sendLocationUpdate } from '../services/signalrService';

export default function DriverMainScreen({ onLogout }: any) {
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [locationSub, setLocationSub] = useState<any>(null);
  
  // Test için sabit bir routeId (Backend'de var olan gerçek bir rotanın Guid'i olmalı)
  const TEST_ROUTE_ID = "1811cce6-1cd9-485a-b279-df7bc9d6ac3f"; 

  const handleToggleRoute = async () => {
    if (isRouteActive) {
      // Rotayı bitir / GPS dinlemeyi durdur
      if (locationSub) {
        locationSub.remove();
        setLocationSub(null);
      }
      setIsRouteActive(false);
    } else {
      // Rotayı başlat / GPS'i aç ve SignalR'a bağla
      const sub = await locationService.startTracking((lat, lng) => {
        console.log(`📡 GPS Okundu: ${lat}, ${lng} -> Backend'e gidiyor...`);
        sendLocationUpdate(TEST_ROUTE_ID, lat, lng);
      });
      
      if (sub) {
        setLocationSub(sub);
        setIsRouteActive(true);
      }
    }
  };

  // Ekran kapandığında (veya çıkış yapıldığında) GPS'i açık bırakmamak için temizlik
  useEffect(() => {
    return () => {
      if (locationSub) locationSub.remove();
    };
  }, [locationSub]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Şoför Kontrol Paneli (Mantık Testi)</Text>
      
      <TouchableOpacity 
        style={[styles.button, isRouteActive ? styles.buttonStop : styles.buttonStart]} 
        onPress={handleToggleRoute}
      >
        <Text style={styles.buttonText}>
          {isRouteActive ? 'Rotayı Durdur (GPS Kapat)' : 'Rotayı Başlat (GPS Aç)'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 30 },
  button: { padding: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonStart: { backgroundColor: '#10B981' },
  buttonStop: { backgroundColor: '#EF4444' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  logoutButton: { marginTop: 40 },
  logoutText: { color: '#2563EB', fontSize: 16 }
});