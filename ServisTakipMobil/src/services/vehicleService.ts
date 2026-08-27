import { API_BASE_URL } from '../constants/config';
import { 
  CreateVehicleDto, 
  AssignVehicleToDriverDto, 
  VehicleResponseDto 
} from '../types/vehicle.types';
import { ApiResponse } from '../types/common.types';

const getAuthHeaders = (token: string) => {
  return { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };
};

export const vehicleService = {
  // POST: /api/Vehicles/add-vehicle
  createVehicle: async (payload: CreateVehicleDto, token: string): Promise<ApiResponse<VehicleResponseDto>> => {
    const response = await fetch(`${API_BASE_URL}/Vehicles/add-vehicle`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // GET: /api/Vehicles
  getByCompany: async (token: string): Promise<ApiResponse<VehicleResponseDto[]>> => {
    const response = await fetch(`${API_BASE_URL}/Vehicles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` 
      },
    });
    return response.json();
  },

  // PUT: /api/Vehicles/assign-driver
  assignDriver: async (payload: AssignVehicleToDriverDto, token: string): Promise<ApiResponse<boolean>> => {
    const response = await fetch(`${API_BASE_URL}/Vehicles/assign-driver`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  }
};