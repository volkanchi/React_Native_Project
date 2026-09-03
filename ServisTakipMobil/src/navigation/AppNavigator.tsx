import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import PassengerMainScreen from "../screens/PassengerMainScreen";
import LiveTrackingScreen from "../screens/LiveTrackingScreen";
import DriverMainScreen from "../screens/DriverMainScreen";
import { getUserRole, storageService } from "../services/storageService";
import SelectStopScreen from "../screens/SelectStopScreen";

// Backend (TokenService.cs) rol claim'ini UserRole enum'unun ToString() hâliyle basıyor:
// Yolcu | Sofor | Firma | Admin. Test/mock login akışında ise "Driver"/"Passenger" değerleri
// üretilebiliyor; ikisini birden karşılayalım ki gerçek API ile de mock veriyle de doğru
// panel açılsın.
const isDriverRole = (role: string | null) =>
  role === "Sofor" || role === "Driver";

type RootStackParamList = {
  Login: undefined;
  PassengerMain: undefined;
  LiveTracking: { routeId: string };
  DriverMain: undefined;
  SelectStop: { routeCode: string; routeName: string; pathCoordinates: any[] };
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
    await storageService.saveToken(token); // Önce gelen token'ı cihaza kaydet
    checkUserStatus(); // Sonra rolü kontrol edip doğru Stack'e yönlendir
  };

  const handleLogout = async () => {
    await storageService.removeToken(); // token'ı cihazdan tamamen sil
    checkUserStatus(); // Sonra durumu güncelle token silindiği için AuthStack'e düşecek
  };
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E4ED8" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userRole ? (
        <Stack.Screen name="Login">
          {() => <AuthScreen onLoginSuccess={handleLoginSuccess} />}
        </Stack.Screen>
      ) : isDriverRole(userRole) ? (
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
                onNavigateToSelectStop={(
                  routeCode,
                  routeName,
                  pathCoordinates,
                  existingStops,
                ) => {
                  navigation.navigate("SelectStop", {
                    routeCode,
                    routeName,
                    pathCoordinates,
                    existingStops: existingStops || [], // 4. parametrenin SelectStop ekranına aktarıldığından emin olun
                  });
                }}
                onLogout={handleLogout}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
          <Stack.Screen name="SelectStop" component={SelectStopScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
