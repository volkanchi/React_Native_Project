import { API_BASE_URL } from '../constants/config'; 

export interface JoinRoutePayload {
  routeCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

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
  }
};