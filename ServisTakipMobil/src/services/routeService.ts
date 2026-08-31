import { API_BASE_URL } from '../constants/config'; 

export interface JoinRoutePayload {
  routeCode: string;
  };


export const routeService = {
  joinRoute: async (payload: JoinRoutePayload, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/PassengerRoute/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      // 1. DÜZELTME: Yanıtı önce metin olarak okuyoruz ki uygulama çökmesin
      const responseText = await response.text();
      let data: any = {};

      // 2. Metin boş değilse JSON'a çevir (Örn: 401 Unauthorized dönmüşse metin boştur)
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.log("JSON dönüştürülemedi. Gelen yanıt:", responseText);
        }
      }

      // 3. Status 200 (OK) değilse ekrana çökmeden hata uyarısı ver
      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || `Yetkisiz işlem veya Hata (Status: ${response.status})` 
        };
      }

      return { 
        success: true, 
        data: data.data || data 
      };
      
    } catch (error) {
      console.error('Route Service Join Error:', error);
      return { 
        success: false, 
        message: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.' 
      };
    } 
  },
  getMyRoutes: async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/PassengerRoute/my-routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      // DİKKAT: JSON'a çevirmeden önce saf metin (text) olarak okuyoruz.
      // Böylece sunucu boş veya HTML dönerse uygulama çökmez.
      const responseText = await response.text();
      
      // Eğer status 200 (OK) değilse hatayı ekrana bas
      if (!response.ok) {
        console.error("API Hatası:", response.status, responseText);
        return { success: false, message: `API Hatası (Status: ${response.status})` };
      }

      // Yanıt boşsa hata ver
      if (!responseText) {
        return { success: false, message: 'Sunucudan boş yanıt döndü.' };
      }

      // Her şey yolundaysa JSON'a çevir
      return JSON.parse(responseText);

    } catch (error) {
      console.error('Get My Routes Error:', error);
      return { success: false, message: 'Bağlantı hatası.' };
    }
  },
};