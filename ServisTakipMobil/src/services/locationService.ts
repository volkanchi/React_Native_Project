import * as Location from 'expo-location';

export const locationService = {
  // Şoför rotayı başlattığında bu fonksiyonu çağıracağız
  startTracking: async (onLocationUpdate: (lat: number, lng: number) => void) => {
    // 1. Kullanıcıdan izin iste
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Konum izni reddedildi.');
      return null; // İzin yoksa işlemi iptal et
    }

    // 2. Cihazın GPS'ini dinlemeye başla
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High, // En yüksek hassasiyet (Navigasyon kalitesi)
        timeInterval: 3000, // En erken 3 saniyede bir güncelle
        distanceInterval: 10, // Veya en az 10 metre yer değiştirdiğinde güncelle
      },
      (location) => {
        // Yeni konum geldiğinde dışarıya (SignalR'a) fırlat
        onLocationUpdate(location.coords.latitude, location.coords.longitude);
      }
    );

    // Aboneliği (subscription) geri dönüyoruz ki rota bitince GPS'i kapatabilelim
    return subscription;
  },
};