// Mirrors ServisTakipApi's DTOs and Response<T> wrapper 1:1 so the panels
// stay in sync with what the backend actually returns.

export type UserRole = "Yolcu" | "Sofor" | "Firma" | "Admin";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ---------- Auth ----------

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  exp: number;
}

// ---------- Company ----------

export interface CompanyCreatePayload {
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
}

export interface CompanyUpdatePayload {
  companyName: string;
  address: string;
  phoneNumber: string;
  email: string;
  username: string;
  taxNumber?: string;
}

export interface CompanyResponse {
  id: string;
  companyName: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  taxNumber: string | null;
  address: string | null;
  createDate: string;
}

// ---------- Drivers ----------

export interface DriverCreatePayload {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

export interface DriverUpdatePayload {
  name: string;
  surname: string;
  phoneNumber: string;
}

export interface DriverResponse {
  driverId: string;
  userId: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  username: string | null;
  phoneNumber: string | null;
}

// ---------- Vehicles ----------

export interface VehicleCreatePayload {
  plateNumber: string;
  brandAndModel: string;
  seatingCapacity: number;
}

export interface VehicleResponse {
  id: string;
  plateNumber: string;
  brandAndModel: string;
  capacity: number;
  companyId: string;
  createDate: string;
}

export interface AssignVehiclePayload {
  driverId: string;
  vehicleId: string;
}

// ---------- Routes ----------

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteCreatePayload {
  name: string;
  vehicleId: string;
  driverId: string;
  pathCoordinates: Coordinate[];
}

export interface RouteUpdatePayload {
  name: string;
  vehicleId: string;
  driverId: string;
}

export interface RouteStopResponse {
  id: string;
  stopOrder: number;
  passengerId: string;
  location: Coordinate;
  isActive: boolean;
}

export interface RouteResponse {
  id: string;
  routeCode: string;
  name: string;
  companyId: string;
  vehicleId: string;
  driverId: string;
  pathCoordinates: Coordinate[];
  stops: RouteStopResponse[];
}

// ---------- Admin ----------

// The backend serializes the Role enum as its underlying number
// (Yolcu=1, Sofor=2, Firma=3, Admin=4), not as a string.
export type NumericRole = 1 | 2 | 3 | 4;

export const ROLE_LABELS: Record<NumericRole, string> = {
  1: "Yolcu",
  2: "Şoför",
  3: "Firma",
  4: "Admin",
};

export interface AdminUserResponse {
  id: string;
  name: string | null;
  surname: string | null;
  username: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: NumericRole;
  companyId: string | null;
  createDate: string | null;
}
