import axios, { AxiosError } from "axios";
import type {
  AdminUserResponse,
  ApiResponse,
  AssignVehiclePayload,
  CompanyCreatePayload,
  CompanyResponse,
  CompanyUpdatePayload,
  DriverCreatePayload,
  DriverResponse,
  DriverUpdatePayload,
  LoginPayload,
  RouteCreatePayload,
  RouteResponse,
  RouteUpdatePayload,
  VehicleCreatePayload,
  VehicleResponse,
} from "@/types";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://servis-takip-api-anir.onrender.com/api";

export const http = axios.create({ baseURL });

const TOKEN_KEY = "servistakip.token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalizes both network failures and Response<T> failure payloads into
// a single Error so pages can just `catch (e) { e.message }`.
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const backendMessage = axiosError.response?.data?.message;
    if (backendMessage) return backendMessage;
    if (axiosError.response?.status === 401)
      return "Oturumunuz sona ermiş görünüyor. Lütfen tekrar giriş yapın.";
    if (axiosError.code === "ERR_NETWORK")
      return "Sunucuya ulaşılamadı. API adresini ve bağlantınızı kontrol edin.";
    return axiosError.message || "Beklenmeyen bir hata oluştu.";
  }
  if (error instanceof Error) return error.message;
  return "Beklenmeyen bir hata oluştu.";
}

async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success) {
    throw new Error(data.message || "İşlem başarısız oldu.");
  }
  return data.data as T;
}

// ---------- Auth ----------

export const authApi = {
  login: (payload: LoginPayload) =>
    unwrap<string>(
      http.post("/User/login", { Email: payload.email, Password: payload.password })
    ),
};

// ---------- Company (self-service, requires Firma role) ----------

export const companyApi = {
  register: (payload: CompanyCreatePayload) =>
    unwrap<CompanyResponse>(
      http.post("/Company/register", {
        CompanyName: payload.companyName,
        Address: payload.address,
        PhoneNumber: payload.phoneNumber,
        Email: payload.email,
        Username: payload.username,
        Password: payload.password,
      })
    ),

  updateProfile: (payload: CompanyUpdatePayload) =>
    unwrap<CompanyResponse>(
      http.put("/Company/update", {
        CompanyName: payload.companyName,
        Address: payload.address,
        PhoneNumber: payload.phoneNumber,
        Email: payload.email,
        Username: payload.username,
        TaxNumber: payload.taxNumber || null,
      })
    ),

  listDrivers: () => unwrap<DriverResponse[]>(http.get("/Company/drivers")),

  addDriver: (payload: DriverCreatePayload) =>
    unwrap<DriverResponse>(
      http.post("/Company/add-driver", {
        Name: payload.name,
        Surname: payload.surname,
        Email: payload.email,
        PhoneNumber: payload.phoneNumber,
        Username: payload.username,
        Password: payload.password,
      })
    ),

  updateDriver: (driverId: string, payload: DriverUpdatePayload) =>
    unwrap<DriverResponse>(
      http.put(`/Company/update-driver/${driverId}`, {
        Name: payload.name,
        Surname: payload.surname,
        PhoneNumber: payload.phoneNumber,
      })
    ),

  deleteDriver: (driverId: string) =>
    unwrap<boolean>(http.delete(`/Company/delete-driver/${driverId}`)),
};

// ---------- Vehicles (Firma role) ----------

export const vehicleApi = {
  list: () => unwrap<VehicleResponse[]>(http.get("/Vehicles")),

  create: (payload: VehicleCreatePayload) =>
    unwrap<VehicleResponse>(
      http.post("/Vehicles/add-vehicle", {
        PlateNumber: payload.plateNumber,
        BrandAndModel: payload.brandAndModel,
        SeatingCapacity: payload.seatingCapacity,
      })
    ),

  assignDriver: (payload: AssignVehiclePayload) =>
    unwrap<boolean>(
      http.put("/Vehicles/assign-driver", {
        DriverId: payload.driverId,
        VehicleId: payload.vehicleId,
      })
    ),

  remove: (vehicleId: string) =>
    unwrap<boolean>(http.delete(`/Vehicles/delete-vehicle/${vehicleId}`)),
};

// ---------- Routes (Firma role) ----------

export const routeApi = {
  list: () => unwrap<RouteResponse[]>(http.get("/Route")),

  create: (payload: RouteCreatePayload) =>
    unwrap<RouteResponse>(
      http.post("/Route/create", {
        Name: payload.name,
        VehicleId: payload.vehicleId,
        DriverId: payload.driverId,
        PathCoordinates: payload.pathCoordinates.map((c) => ({
          Latitude: c.latitude,
          Longitude: c.longitude,
        })),
      })
    ),

  update: (routeId: string, payload: RouteUpdatePayload) =>
    unwrap<RouteResponse>(
      http.put(`/Route/${routeId}`, {
        Name: payload.name,
        VehicleId: payload.vehicleId,
        DriverId: payload.driverId,
      })
    ),

  remove: (routeId: string) => unwrap<boolean>(http.delete(`/Route/${routeId}`)),
};

// ---------- Admin (Admin role) ----------

export const adminApi = {
  listCompanies: () => unwrap<CompanyResponse[]>(http.get("/Admin/companies")),

  registerCompany: (payload: CompanyCreatePayload) => companyApi.register(payload),

  deleteCompany: (companyId: string) =>
    unwrap<boolean>(http.delete(`/Admin/companies/${companyId}`)),

  listUsers: () => unwrap<AdminUserResponse[]>(http.get("/Admin/users")),

  deleteUser: (userId: string) =>
    unwrap<boolean>(http.delete(`/Admin/users/${userId}`)),
};
