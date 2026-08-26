import { API_BASE_URL } from '../constants/config';
import { 
  CompanyCreateDto, 
  CompanyUpdateDto, 
  CompanyResponseDto 
} from '../types/company.types';
import { 
  DriverCreateDto, 
  DriverUpdateDto, 
  DriverResponseDto 
} from '../types/driver.types';
import { ApiResponse } from '../types/common.types';

const getAuthHeaders = (token: string) => {
  return { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };
};

export const companyService = {
  // POST: /api/Company/register
  register: async (payload: CompanyCreateDto, token: string): Promise<ApiResponse<CompanyResponseDto>> => {
    const response = await fetch(`${API_BASE_URL}/api/Company/register`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // PUT: /api/Company/update
  update: async (payload: CompanyUpdateDto, token: string): Promise<ApiResponse<boolean>> => {
    const response = await fetch(`${API_BASE_URL}/api/Company/update`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // POST: /api/Company/add-driver
  addDriver: async (payload: DriverCreateDto, token: string): Promise<ApiResponse<DriverResponseDto>> => {
    const response = await fetch(`${API_BASE_URL}/api/Company/add-driver`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // PUT: /api/Company/update-driver/{driverId}
  updateDriver: async (driverId: string, payload: DriverUpdateDto, token: string): Promise<ApiResponse<DriverResponseDto>> => {
    const response = await fetch(`${API_BASE_URL}/api/Company/update-driver/${driverId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // DELETE: /api/Company/delete-driver/{driverId}
  deleteDriver: async (driverId: string, token: string): Promise<ApiResponse<boolean>> => {
    const response = await fetch(`${API_BASE_URL}/api/Company/delete-driver/${driverId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    return response.json();
  }
};