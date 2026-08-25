import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface PassengerMainProps {
  user: any;
  onNavigateToLiveTracking: (routeId: string) => void;
  onLogout: () => void;
}

export default function PassengerMainScreen({
  user,
  onNavigateToLiveTracking,
  onLogout,
}: PassengerMainProps) {
  // Örnek atanmış servis bilgisi (veritabanından gelecek)
  const activeRoute = {
    id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    code: "RTE-4829",
    name: "Sabah - Maslak Hattı",
    driverName: "Mehmet Kaptan",
    plate: "34 ABC 123",
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Personel'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* Aktif Rota Kartı */}
      <View style={styles.routeCard}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Kayıtlı Servis</Text>
        </View>
        <Text style={styles.routeName}>{activeRoute.name}</Text>
        <Text style={styles.routeCode}>Kod: {activeRoute.code}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sürücü:</Text>
          <Text style={styles.infoValue}>{activeRoute.driverName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Plaka:</Text>
          <Text style={styles.infoValue}>{activeRoute.plate}</Text>
        </View>

        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => onNavigateToLiveTracking(activeRoute.id)}
        >
          <Text style={styles.trackButtonText}>📍 Canlı Takibe Başla</Text>
        </TouchableOpacity>
      </View>

      {/* "Yarın Yokum" Butonu */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => Alert.alert('Bildirim Gönderildi', 'Yarın servisi kullanmayacağınız şoföre iletildi.')}
      >
        <Text style={styles.secondaryButtonText}>🛑 Yarın Servisi Kullanmayacağım</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: '#6b7280' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  logoutButton: { backgroundColor: '#fee2e2', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  logoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 13 },
  routeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, marginBottom: 16 },
  badgeContainer: { alignSelf: 'flex-start', backgroundColor: '#dbeafe', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginBottom: 8 },
  badgeText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },
  routeName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  routeCode: { fontSize: 14, color: '#9ca3af', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#6b7280', fontSize: 14 },
  infoValue: { color: '#111827', fontSize: 14, fontWeight: '600' },
  trackButton: { backgroundColor: '#10b981', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },
  trackButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f87171', borderRadius: 10, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});