import { API_BASE_URL } from "../constants/config";
import {
  UserRegisterDto,
  UserLoginDto,
  UserUpdateDto,
  UserDto,
} from "../types/auth.types";
import { ApiResponse } from "../types/common.types";

// Token'ı almak için yardımcı bir fonksiyon
const getAuthHeaders = (token?: string): Record<string, string> => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authService = {
  // POST: /api/User/register
  register: async (payload: UserRegisterDto): Promise<ApiResponse<UserDto>> => {
    const response = await fetch(`${API_BASE_URL}/User/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // POST: /api/User/login
  // Not: Backend'de login başarılı olunca data içinde token döndüğünü varsayıyoruz (string).
  login: async (payload: UserLoginDto): Promise<ApiResponse<string>> => {
    const response = await fetch(`${API_BASE_URL}/User/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  // GET: /api/User/my-profile (Authorize gerektirir)
  getProfile: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/User/my-profile`, {
      method: "GET",
      headers: getAuthHeaders(token),
    });
    return response.json();
  },

  // PUT: /api/User/update-profile (Authorize gerektirir)
  updateProfile: async (
    payload: UserUpdateDto,
    token: string,
  ): Promise<ApiResponse<UserDto>> => {
    const response = await fetch(`${API_BASE_URL}/User/update-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(token),
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  // DELETE: /api/User/delete-profile (Authorize gerektirir)
  deleteProfile: async (token: string): Promise<ApiResponse<boolean>> => {
    const response = await fetch(`${API_BASE_URL}/User/delete-profile`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(token),
      },
    });
    return response.json();
  },
};
