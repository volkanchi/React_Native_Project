import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, LayoutAnimation, Platform, UIManager
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path, Circle, Rect, Polygon, Ellipse } from 'react-native-svg';
import { routeService } from '../services/routeService';
import { storageService } from '../services/storageService';

// Android'de LayoutAnimation (Açılır/Kapanır Kart animasyonu) için gerekli ayar
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Yapay zekanın ürettiği varsayılan/örnek veriler (İleride API'den gelecek)
const ROUTE_DATA = {
  name: "Merkez Ekspres",
  number: "R-07",
  driver: { name: "Ahmet Yılmaz", initials: "AY", rating: 4.9 },
  plate: "34 ABC 123",
  stops: [
    { id: 1, label: "Ana Durak", time: "07:45", status: "passed" },
    { id: 2, label: "Meydan", time: "07:58", status: "passed" },
    { id: 3, label: "İş Merkezi", time: "08:12", status: "next" },
    { id: 4, label: "Kuzey Plaza", time: "08:28", status: "upcoming" },
  ],
  eta: "8 dk",
  distance: "2.4 km",
  occupancy: 14,
  capacity: 22,
};

interface PassengerMainScreenProps {
  user: any;
  onNavigateToLiveTracking: (routeId: string) => void;
  onLogout: () => void;
}

export default function PassengerMainScreen({ 
  user, onNavigateToLiveTracking, onLogout 
}: PassengerMainScreenProps) {
  const [routeCode, setRouteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  // Kartın açılıp kapanma animasyonu
  const toggleSheet = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetExpanded(!sheetExpanded);
  };

  const handleJoinRoute = async () => {
    if (!routeCode.trim()) {
      Alert.alert('Uyarı', 'Lütfen katılmak için bir rota kodu giriniz.');
      return;
    }
    setLoading(true);
    try {
      const token = await storageService.getToken();
      if (!token) {
        onLogout();
        return;
      }
      const payload = { routeCode: routeCode, location: { latitude: 41.0082, longitude: 28.9784 } };
      const result = await routeService.joinRoute(payload, token);

      if (result.success && result.data) {
        onNavigateToLiveTracking(result.data.id);
      } else {
        Alert.alert('Hata', result.message || 'Rota bulunamadı.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucu bağlantısı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const occupancyPct = ROUTE_DATA.occupancy / ROUTE_DATA.capacity;

  return (
    <View style={styles.container}>
      {/* 1. MAP AREA (Gerçek Harita) */}
      <MapView 
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
        showsUserLocation={true}
      >
        <Marker coordinate={{ latitude: 41.0182, longitude: 28.9784 }} title="Şu anki konum" />
      </MapView>

      {/* Üst Bar (Top Bar) */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoIcon}>
            <BusIconSmall />
          </View>
          <Text style={styles.appName}>ServisTakip</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
          <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* 2. BOTTOM SHEET (Detay Kartı) */}
      <View style={[styles.bottomSheet, { height: sheetExpanded ? '85%' : '48%' }]}>
        {/* Sürükleme Çubuğu */}
        <TouchableOpacity style={styles.dragHandleContainer} onPress={toggleSheet}>
          <View style={styles.dragHandle} />
        </TouchableOpacity>

        <ScrollView style={styles.scrollInner} showsVerticalScrollIndicator={false}>
          {/* Güzergah Başlığı ve Doluluk Oranı */}
          <View style={styles.routeHeader}>
            <View>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>{ROUTE_DATA.number}</Text></View>
                <Text style={styles.statusText}>Aktif</Text>
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.routeTitle}>{ROUTE_DATA.name}</Text>
            </View>
            <OccupancyRing pct={occupancyPct} current={ROUTE_DATA.occupancy} total={ROUTE_DATA.capacity} />
          </View>

          {/* Şoför ve Araç Bilgisi */}
          <View style={styles.driverCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{ROUTE_DATA.driver.initials}</Text></View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverLabel}>Şoför</Text>
              <Text style={styles.driverName}>{ROUTE_DATA.driver.name}</Text>
              <View style={styles.ratingRow}>
                <StarIcon />
                <Text style={styles.ratingText}>{ROUTE_DATA.driver.rating}</Text>
              </View>
            </View>
            <View style={styles.plateTag}>
              <Text style={styles.plateLabel}>PLAKA</Text>
              <Text style={styles.plateText}>{ROUTE_DATA.plate}</Text>
            </View>
          </View>

          {/* Genişletildiğinde Görünen Duraklar Listesi */}
          {sheetExpanded && (
            <View style={styles.stopsContainer}>
              <Text style={styles.stopsTitle}>DURAKLAR</Text>
              {ROUTE_DATA.stops.map((stop, i) => (
                <StopRow key={stop.id} stop={stop} isLast={i === ROUTE_DATA.stops.length - 1} />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Aksiyon Alanı (Rota Kodu ve Buton) */}
        <View style={styles.ctaArea}>
          <TextInput
            style={styles.input}
            placeholder="Rota Kodunu Giriniz (Örn: 34ABC123)"
            value={routeCode}
            onChangeText={setRouteCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleJoinRoute}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Rotaya Katıl</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Alt Bileşenler (Components) ── */

function StopRow({ stop, isLast }: { stop: any; isLast: boolean }) {
  const passed = stop.status === "passed";
  const next = stop.status === "next";
  return (
    <View style={styles.stopRow}>
      <View style={styles.stopNode}>
        <View style={[styles.stopCircle, passed && styles.stopCirclePassed, next && styles.stopCircleNext]} />
        {!isLast && <View style={[styles.stopLine, passed && { backgroundColor: '#CBD5E1' }]} />}
      </View>
      <View style={styles.stopDetails}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[styles.stopName, passed && {color: '#94A3B8'}, next && {color: '#1E4ED8'}]}>{stop.label}</Text>
          {next && <View style={styles.nextBadge}><Text style={styles.badgeText}>Sıradaki</Text></View>}
        </View>
        <Text style={styles.stopTime}>{stop.time}</Text>
      </View>
    </View>
  );
}

function OccupancyRing({ pct, current, total }: { pct: number; current: number; total: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = pct > 0.8 ? "#EF4444" : pct > 0.6 ? "#F59E0B" : "#22C55E";
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="48" height="48" viewBox="0 0 48 48">
        <Circle cx="24" cy="24" r={r} fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
        <Circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3.5" 
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      </Svg>
      {/* Yazıyı SVG üstüne oturtmak için absolute kullandık */}
      <View style={StyleSheet.absoluteFillObject}><View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <Text style={{fontSize: 12, fontWeight: 'bold', color: color}}>{current}</Text>
      </View></View>
      <Text style={{fontSize: 11, color: '#6b7280', marginTop: -4}}>/ {total}</Text>
    </View>
  );
}

/* ── İkonlar (SVG) ── */
const BusIconSmall = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="5" width="20" height="12" rx="2" /><Path d="M2 10h20" />
    <Circle cx="7" cy="19" r="1.5" /><Circle cx="17" cy="19" r="1.5" />
  </Svg>
);
const StarIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B">
    <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </Svg>
);

/* ── Stiller ── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8EDF4' },
  topBar: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 12 },
  logoIcon: { width: 32, height: 32, backgroundColor: '#1E4ED8', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  appName: { fontWeight: 'bold', color: '#374151' },
  iconButton: { backgroundColor: '#fff', padding: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  dragHandleContainer: { alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  scrollInner: { paddingHorizontal: 20 },
  
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  badge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 8 },
  badgeText: { color: '#1E4ED8', fontSize: 10, fontWeight: 'bold' },
  statusText: { fontSize: 12, color: '#6b7280', marginRight: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' },
  routeTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FC', padding: 12, borderRadius: 16, borderColor: '#EEF0F4', borderWidth: 1, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E4ED8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  driverInfo: { flex: 1 },
  driverLabel: { fontSize: 12, color: '#6b7280' },
  driverName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontSize: 12, color: '#4B5563', marginLeft: 4, fontWeight: 'bold' },
  plateTag: { backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  plateLabel: { fontSize: 10, color: '#6b7280', letterSpacing: 1 },
  plateText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, color: '#111827' },

  stopsContainer: { marginBottom: 20 },
  stopsTitle: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 },
  stopRow: { flexDirection: 'row', minHeight: 40 },
  stopNode: { width: 20, alignItems: 'center' },
  stopCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#fff', borderColor: '#CBD5E1', borderWidth: 2, marginTop: 4 },
  stopCirclePassed: { backgroundColor: '#94A3B8', borderWidth: 0 },
  stopCircleNext: { backgroundColor: '#1E4ED8', borderWidth: 0, shadowColor: '#1E4ED8', shadowOpacity: 0.3, shadowRadius: 4 },
  stopLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  stopDetails: { flex: 1, paddingBottom: 16, paddingLeft: 12, flexDirection: 'row', justifyContent: 'space-between' },
  stopName: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  nextBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 8 },
  stopTime: { fontSize: 12, color: '#9CA3AF' },

  ctaArea: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f3f4f6' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  primaryButton: { backgroundColor: '#1E4ED8', padding: 16, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});