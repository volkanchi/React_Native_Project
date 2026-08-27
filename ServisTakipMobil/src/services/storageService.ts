import AsyncStorage from '@react-native-async-storage/async-storage';

// Cihaz hafızasında veriyi tutacağımız anahtar (key) ismi
const TOKEN_KEY = '@servis_takip_jwt_token';

export const storageService = {
  // Token'ı cihaza kaydeder (Login ve Register sonrası kullanılır)
  saveToken: async (token: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Token kaydedilirken hata oluştu:', error);
      return false;
    }
  },

  // Cihazdaki Token'ı okur (Uygulama açılışında otomatik giriş için kullanılır)
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Token okunurken hata oluştu:', error);
      return null;
    }
  },

  // Token'ı cihazdan siler (Çıkış yap - Logout işlemi için kullanılır)
  removeToken: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return true;
    } catch (error) {
      console.error('Token silinirken hata oluştu:', error);
      return false;
    }
  }
};