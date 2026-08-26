import { ApiResponse } from './common.types';

// Enum: UserRole 
export enum UserRole {
    Yolcu = 1,
    Sofor = 2,
    Firma = 3,
    Admin = 4
}

// --- Request DTOs ---
export interface UserRegisterDto {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

export interface UserLoginDto {
  email: string;
  password: string;
}

export interface UserUpdateDto {
  name: string;
  surname: string;
  phoneNumber: string;
}

// --- Response DTOs ---
export interface UserDto {
  name: string;
  surname: string;
  username: string;
  email: string;
  role: UserRole;
}