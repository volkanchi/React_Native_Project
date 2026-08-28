import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import PassengerMainScreen from '../screens/PassengerMainScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import { getUserRole } from '../services/storageService';

type RootStackParamList = {
  Login: undefined;
  PassengerMain: undefined;
  LiveTracking: { routeId: string };
  DriverMain: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Uygulama açıldığında token'ı ve rolü kontrol et
  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      setUserRole(await getUserRole());
    } finally {
      setIsLoading(false);
    }
  };

  // Çıkış yapıldığında veya giriş yapıldığında tetiklenecek fonksiyon
  // Bunu sayfalara props veya Context olarak geçebiliriz
  const handleAuthChange = () => {
    checkUserStatus();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1E4ED8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {!userRole ? (
          <Stack.Screen name="Login">
            {() => <AuthScreen onLoginSuccess={handleAuthChange} />}
          </Stack.Screen>
        ) : 
        userRole === 'Driver' ? (
          <Stack.Screen name="DriverMain">
            {() => <DriverPlaceholder onLogout={handleAuthChange} />}
          </Stack.Screen>
        ) : 
        (
          <>
            <Stack.Screen name="PassengerMain">
              {({ navigation }) => (
                <PassengerMainScreen
                  user={null}
                  onNavigateToLiveTracking={(routeId) =>
                    navigation.navigate('LiveTracking', { routeId })
                  }
                  onLogout={handleAuthChange}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
          </>
        )}

      </Stack.Navigator>
    </NavigationContainer>
  );
}

function DriverPlaceholder({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Şoför ekranı hazırlanıyor.</Text>
      <TouchableOpacity onPress={onLogout}>
        <Text style={{ color: '#1E4ED8', marginTop: 16 }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}