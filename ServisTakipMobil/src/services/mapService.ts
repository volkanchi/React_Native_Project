import { API_BASE_URL } from '../constants/config';
import { storageService } from './storageService';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export const mapService = {
  getRoutePolyline: async (stops: Coordinate[]): Promise<Coordinate[]> => {
    if (!stops || stops.length < 2) return [];

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

      if (!response.ok) return [];

      const result = await response.json();
      return result.success && Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Polyline getirme hatası:', error);
      return [];
    }
  },
};