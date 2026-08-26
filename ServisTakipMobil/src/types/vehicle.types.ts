import { ApiResponse } from './common.types';

// --- Request DTOs ---

export interface CreateVehicleDto {
  plateNumber: string; //[cite: 16]
  brandAndModel: string; //[cite: 16]
  seatingCapacity: number; //[cite: 16]
}

export interface AssignVehicleToDriverDto {
  driverId: string; // C# tarafında Guid[cite: 15]
  vehicleId: string; // C# tarafında Guid[cite: 15]
}

// --- Response DTOs ---

export interface VehicleResponseDto {
  id: string; //[cite: 17]
  plateNumber: string; //[cite: 17]
  brandAndModel: string; //[cite: 17]
  capacity: number; //[cite: 17]
  companyId: string; //[cite: 17]
  createDate: string; // C# tarafında DateTime, TypeScript'te ISO string[cite: 17]
}