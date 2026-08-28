import { API_BASE_URL } from '../constants/config';
import { 
  UserRegisterDto, 
  UserLoginDto, 
  UserUpdateDto, 
  UserDto 
} from '../types/auth.types';
import { ApiResponse } from '../types/common.types';

// Token'ı almak için yardımcı bir fonksiyon 
const getAuthHeaders = (token?: string): Record<string, string> => {
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const readResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const text = await response.text();
  let body: Partial<ApiResponse<T>> = {};

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
  }

  if (!response.ok) {
    return {
      success: false,
      message: body.message || `İstek başarısız oldu (${response.status}).`,
    };
  }

  return {
    success: body.success === true,
    message: body.message || '',
    data: body.data,
  };
};

export const authService = {
  // POST: /api/User/register
  register: async (payload: UserRegisterDto): Promise<ApiResponse<UserDto>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return readResponse<UserDto>(response);
    } catch {
      return { success: false, message: 'Sunucuya ulaşılamadı.' };
    }
  },

  // POST: /api/User/login
  // Not: Backend'de login başarılı olunca data içinde token döndüğünü varsayıyoruz (string).
  login: async (payload: UserLoginDto): Promise<ApiResponse<string>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return readResponse<string>(response);
    } catch {
      return { success: false, message: 'Sunucuya ulaşılamadı.' };
    }
  },

  // PUT: /api/User/update-profile (Authorize gerektirir)
  updateProfile: async (payload: UserUpdateDto, token: string): Promise<ApiResponse<UserDto>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/update-profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        },
        body: JSON.stringify(payload),
      });
      return readResponse<UserDto>(response);
    } catch {
      return { success: false, message: 'Sunucuya ulaşılamadı.' };
    }
  },

  // DELETE: /api/User/delete-profile (Authorize gerektirir)
  deleteProfile: async (token: string): Promise<ApiResponse<boolean>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/delete-profile`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(token)
        }
      });
      return readResponse<boolean>(response);
    } catch {
      return { success: false, message: 'Sunucuya ulaşılamadı.' };
    }
  }
};