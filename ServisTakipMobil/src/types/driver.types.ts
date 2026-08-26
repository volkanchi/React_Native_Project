import { ApiResponse } from './common.types';

// --- Request DTOs ---

export interface DriverCreateDto {
  name: string; //[cite: 11]
  surname: string; //[cite: 11]
  email: string; //[cite: 11]
  phoneNumber: string; //[cite: 11]
  username: string; //[cite: 11]
  password: string; //[cite: 11]
}

export interface DriverUpdateDto {
  name: string; //[cite: 14]
  surname: string; //[cite: 14]
  phoneNumber: string; //[cite: 14]
}

export interface DriverLocationDto {
  routeId: string; // C# tarafında Guid[cite: 12]
  latitude: number; //[cite: 12]
  longitude: number; //[cite: 12]
  speed?: number; // C# tarafında nullable double[cite: 12]
  heading?: number; // C# tarafında nullable double[cite: 12]
  timestamp: string; // C# tarafında DateTime, TypeScript'te ISO 8601 string[cite: 12]
}

// --- Response DTOs ---

export interface DriverResponseDto {
  driverId: string; //[cite: 13]
  userId: string; //[cite: 13]
  name?: string; //[cite: 13]
  surname?: string; //[cite: 13]
  email?: string; //[cite: 13]
  username?: string; //[cite: 13]
  phoneNumber?: string; //[cite: 13]
}