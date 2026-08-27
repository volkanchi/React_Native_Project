import { API_BASE_URL } from '../constants/config';

export interface JoinRoutePayload {
  routeCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export const routeService = {
  // Rotaya katılma isteği atan fonksiyon
  joinRoute: async (payload: JoinRoutePayload, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/PassengerRoute/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Backend'in bizi tanıması için JWT'yi Authorization başlığına ekliyoruz
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      // Backend'den gelen JSON yanıtını okuyoruz (DTO'ya uygun şekilde)
      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Rotaya katılırken bir hata oluştu.' 
        };
      }

      return { 
        success: true, 
        data: data 
      };
      
    } catch (error) {
      console.error('Route Service Join Error:', error);
      return { 
        success: false, 
        message: 'Sunucu ile iletişim kurulamadı. Lütfen internet bağlantınızı kontrol edin.' 
      };
    }
  }
};