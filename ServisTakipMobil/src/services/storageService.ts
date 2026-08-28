import { jwtDecode } from 'jwt-decode';
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
export const getUserRole = async (): Promise<string | null> => {
  const token = await storageService.getToken();
  if (!token) return null;

  // Daha önce kaydedilmiş test veya bozuk değerler uygulama açılışını engellememeli.
  if (token.trim().split('.').length !== 3) {
    await storageService.removeToken();
    return null;
  }

  try {
    const decodedToken: { exp?: number; role?: string; [key: string]: unknown } = jwtDecode(token);
    if (decodedToken.exp && decodedToken.exp * 1000 <= Date.now()) {
      await storageService.removeToken();
      return null;
    }

    const roleClaim = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role;
    return typeof roleClaim === 'string' ? roleClaim : null;
  } catch {
    // Geçersiz JWT, oturum yokmuş gibi ele alınır.
    await storageService.removeToken();
    return null;
  }
}