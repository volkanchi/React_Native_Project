import { ApiResponse } from './common.types';

// --- Request DTOs ---
export interface CompanyCreateDto {
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
}

export interface CompanyUpdateDto {
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  taxNumber?: string;
}

// --- Response DTOs ---
export interface CompanyResponseDto {
  id: string; // C# Guid, TypeScript'te string olarak ifade edilir
  companyName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  taxNumber?: string;
  address?: string;
  createDate: string; // C# DateTime, TypeScript'te ISO string olarak ifade edilir
}