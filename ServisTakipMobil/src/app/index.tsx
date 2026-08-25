import React, { useState } from 'react';
import AuthScreen from '../screens/AuthScreen';
import PassengerMainScreen from '../screens/PassengerMainScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';

export default function AppEntry() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'AUTH' | 'MAIN' | 'TRACKING'>('AUTH');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');

  // Giriş başarılı olunca Ana Ekrana geç
  const handleLoginSuccess = (authToken: string, userData: any) => {
    setToken(authToken);
    setUser(userData);
    setCurrentScreen('MAIN');
  };

  // Çıkış yapınca Auth ekranına dön
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentScreen('AUTH');
  };

  // Canlı takibe geç
  const handleStartTracking = (routeId: string) => {
    setSelectedRouteId(routeId);
    setCurrentScreen('TRACKING');
  };

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