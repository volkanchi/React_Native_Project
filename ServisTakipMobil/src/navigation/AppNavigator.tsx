import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import PassengerMainScreen from "../screens/PassengerMainScreen";
import LiveTrackingScreen from "../screens/LiveTrackingScreen";
import DriverMainScreen from '../screens/DriverMainScreen';
import { getUserRole, storageService } from "../services/storageService";

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
  const handleLoginSuccess = async (token: string) => {
    const saved = await storageService.saveToken(token);
    if (saved) await checkUserStatus();
  };

  const handleLogout = async () => {
    await storageService.removeToken(); // token'ı cihazdan tamamen sil
    await checkUserStatus();
  };
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E4ED8" />
      </View>
    );
  }

  return (
    
      <Stack.Navigator key={userRole || "guest"} screenOptions={{ headerShown: false }}>
      {!userRole ? (
        <Stack.Screen name="Login">
          {() => <AuthScreen onLoginSuccess={handleLoginSuccess} />}
        </Stack.Screen>
      ) : userRole === "Sofor" || userRole === "Driver" ? (
        <Stack.Screen name="DriverMain">
          {() => <DriverMainScreen onLogout={handleLogout} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="PassengerMain">
            {({ navigation }) => (
              <PassengerMainScreen
                user={null}
                onNavigateToLiveTracking={(routeId) =>
                  navigation.navigate("LiveTracking", { routeId })
                }
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
        </>
      )}
      </Stack.Navigator>
    
  );
}

