import { API_BASE_URL } from '../constants/config';
import { storageService } from './storageService';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export const mapService = {
  getRoutePolyline: async (stops: Coordinate[]): Promise<Coordinate[]> => {
    if (!stops || stops.length < 2) {
      console.warn('⚠️ Rota çizimi için en az 2 nokta gerekli.');
      return [];
    }

    try {
      const token = await storageService.getToken();
      const response = await fetch(`${API_BASE_URL}/map/route`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stops }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`❌ Backend Rota Hatası [Status ${response.status}]:`, responseText);
        return [];
      }

      const result = JSON.parse(responseText);
      if (result.success && Array.isArray(result.data)) {
        console.log(`🗺️ Polyline koordinatları alındı: ${result.data.length} nokta`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Polyline istek atılırken ağ hatası:', error);
      return [];
    }
  },
};