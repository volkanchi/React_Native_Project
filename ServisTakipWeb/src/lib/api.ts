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

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://servis-takip-api-anir.onrender.com/api";

export const http = axios.create({ baseURL });

const TOKEN_KEY = "servistakip.token";

export function getStoredToken(): string | null {
  const token =
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token");
  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token === "[object Object]"
  ) {
    return null;
  }
  return token.replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "").trim();
}

export function setStoredToken(token: string) {
  const clean = String(token)
    .replace(/^Bearer\s+/i, "")
    .replace(/^"|"$/g, "")
    .trim();
  localStorage.setItem(TOKEN_KEY, clean);
  localStorage.setItem("token", clean);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("token");
}

// 1. Her HTTP isteğine Bearer Token başlığını ekleyen interceptor
http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Backend'in Response<T> sarmalayıcısından asıl veriyi (.data) çıkaran unwrap
async function unwrap<T>(promise: Promise<{ data: any }>): Promise<T> {
  const res = await promise;
  const body = res.data;

  if (body && typeof body === "object" && "success" in body) {
    if (body.success === false) {
      throw new Error(body.message || "İşlem başarısız oldu.");
    }
    return body.data as T;
  }
  return body as T;
}

// Hata mesajlarını ayıklama
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const resData = error.response?.data as any;
    if (typeof resData === "string" && resData.length > 0) return resData;
    if (resData?.message) return resData.message;
    if (resData?.title) return resData.title;
    if (resData?.errors && typeof resData.errors === "object") {
      return Object.values(resData.errors).flat().join(" - ");
    }
    if (error.response?.status === 401)
      return "Oturum süreniz doldu veya bu işlem için yetkiniz bulunmuyor.";
    if (error.code === "ERR_NETWORK")
      return "Sunucuya ulaşılamadı. API adresi veya internet bağlantınızı kontrol edin.";
    return error.message || "Beklenmeyen bir hata oluştu.";
  }
  if (error instanceof Error) return error.message;
  return "Beklenmeyen bir hata oluştu.";
}

// ---------- Auth ----------
export const authApi = {
  login: async (payload: LoginPayload): Promise<string> => {
    const res = await http.post("/User/login", {
      email: payload.email,
      password: payload.password,
    });
    const resData = res.data;

    if (resData && typeof resData === "object" && resData.success === false) {
      throw new Error(resData.message || "Giriş başarısız.");
    }

    let tokenStr = "";
    if (typeof resData === "string") {
      tokenStr = resData;
    } else if (resData && typeof resData === "object") {
      if (typeof resData.data === "string") {
        tokenStr = resData.data;
      } else if (typeof resData.token === "string") {
        tokenStr = resData.token;
      } else if (resData.data && typeof resData.data === "object") {
        tokenStr = resData.data.token || resData.data.accessToken || "";
      }
    }

    if (!tokenStr) {
      throw new Error("Sunucudan geçerli bir token alınamadı.");
    }
    return tokenStr;
  },
};

// ---------- Company (Firma Rolü) ----------
export const companyApi = {
  register: (payload: CompanyCreatePayload) =>
    unwrap<CompanyResponse>(
      http.post("/Company/register", {
        companyName: payload.companyName,
        address: payload.address,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        username: payload.username,
        password: payload.password,
      })
    ),
  updateProfile: (payload: CompanyUpdatePayload) =>
    unwrap<CompanyResponse>(
      http.put("/Company/update", {
        companyName: payload.companyName,
        address: payload.address,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        username: payload.username,
        taxNumber: payload.taxNumber || null,
      })
    ),
  listDrivers: () => unwrap<DriverResponse[]>(http.get("/Company/drivers")),
  addDriver: (payload: DriverCreatePayload) =>
    unwrap<DriverResponse>(
      http.post("/Company/add-driver", {
        name: payload.name,
        surname: payload.surname,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        username: payload.username,
        password: payload.password,
      })
    ),
  updateDriver: (driverId: string, payload: DriverUpdatePayload) =>
    unwrap<DriverResponse>(
      http.put(`/Company/update-driver/${driverId}`, {
        name: payload.name,
        surname: payload.surname,
        phoneNumber: payload.phoneNumber,
      })
    ),
  deleteDriver: (driverId: string) =>
    unwrap<boolean>(http.delete(`/Company/delete-driver/${driverId}`)),
};

// ---------- Vehicles (Firma Rolü) ----------
export const vehicleApi = {
  list: () => unwrap<VehicleResponse[]>(http.get("/Vehicles")),
  create: (payload: VehicleCreatePayload) =>
    unwrap<VehicleResponse>(
      http.post("/Vehicles/add-vehicle", {
        plateNumber: payload.plateNumber,
        brandAndModel: payload.brandAndModel,
        seatingCapacity: payload.seatingCapacity,
      })
    ),
  assignDriver: (payload: AssignVehiclePayload) =>
    unwrap<boolean>(
      http.put("/Vehicles/assign-driver", {
        driverId: payload.driverId,
        vehicleId: payload.vehicleId,
      })
    ),
  remove: (vehicleId: string) =>
    unwrap<boolean>(http.delete(`/Vehicles/delete-vehicle/${vehicleId}`)),
};

// ---------- Routes (Firma Rolü) ----------
export const routeApi = {
  list: () => unwrap<RouteResponse[]>(http.get("/Route")),
  create: (payload: RouteCreatePayload) =>
    unwrap<RouteResponse>(
      http.post("/Route/create", {
        name: payload.name,
        vehicleId: payload.vehicleId,
        driverId: payload.driverId,
        pathCoordinates: (payload.pathCoordinates || []).map((c) => ({
          latitude: c.latitude,
          longitude: c.longitude,
        })),
      })
    ),
  update: (routeId: string, payload: RouteUpdatePayload) =>
    unwrap<RouteResponse>(
      http.put(`/Route/${routeId}`, {
        name: payload.name,
        vehicleId: payload.vehicleId,
        driverId: payload.driverId,
      })
    ),
  remove: (routeId: string) =>
    unwrap<boolean>(http.delete(`/Route/${routeId}`)),
};

// ---------- Admin (Admin Rolü) ----------
export const adminApi = {
  listCompanies: () => unwrap<CompanyResponse[]>(http.get("/Admin/companies")),
  registerCompany: (payload: CompanyCreatePayload) =>
    companyApi.register(payload),
  deleteCompany: (companyId: string) =>
    unwrap<boolean>(http.delete(`/Admin/companies/${companyId}`)),
  listUsers: () => unwrap<AdminUserResponse[]>(http.get("/Admin/users")),
  deleteUser: (userId: string) =>
    unwrap<boolean>(http.delete(`/Admin/users/${userId}`)),
};