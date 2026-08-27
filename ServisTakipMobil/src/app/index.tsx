import React, { useEffect, useState } from 'react';
import AuthScreen from '../screens/AuthScreen';
import PassengerMainScreen from '../screens/PassengerMainScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import { storageService } from '../services/storageService';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AppEntry() {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'AUTH' | 'MAIN' | 'TRACKING'>('AUTH');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Storagede token varsa otomatik giriş yap
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = await storageService.getToken();
      
      if (storedToken) {
        setToken(storedToken);
        setCurrentScreen('MAIN');
      }
      
      setIsLoading(false); // Kontrol bitti, ekranı göster
    };

    checkAuthStatus();
  }, []);

  // Giriş başarılı olunca Ana Ekrana geç ve tokenı kaydet 
  const handleLoginSuccess = async (authToken: string, userData: any) => {
    await storageService.saveToken(authToken);
    setToken(authToken);
    setUser(userData);
    setCurrentScreen('MAIN');
  };

  // Çıkış yapınca Auth ekranına dön
  const handleLogout = async () => {
    await storageService.removeToken();
    setToken(null);
    setUser(null);
    setCurrentScreen('AUTH');
  };

  // Canlı takibe geç
  const handleStartTracking = (routeId: string) => {
    setSelectedRouteId(routeId);
    setCurrentScreen('TRACKING');
  };
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (currentScreen === 'AUTH') {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === 'MAIN') {
    return (
      <PassengerMainScreen
        user={user}
        onNavigateToLiveTracking={handleStartTracking}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LiveTrackingScreen
      routeId={selectedRouteId}
      token={token ?? ''}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  }
});