import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi, clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";
import { decodeToken, isTokenExpired } from "@/lib/jwt";
import type { DecodedToken } from "@/types";

interface AuthContextValue {
  user: DecodedToken | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<DecodedToken>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PANEL_ROLES: DecodedToken["role"][] = ["Firma", "Admin"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      try {
        const decoded = decodeToken(token);
        // Only Firma/Admin sessions belong in this app. A Yolcu/Şoför token
        // (e.g. left over from testing) must never be "logged in" here, or
        // ProtectedRoute and this page's own redirect will bounce forever.
        if (isTokenExpired(decoded) || !PANEL_ROLES.includes(decoded.role)) {
          clearStoredToken();
        } else {
          setUser(decoded);
        }
      } catch {
        clearStoredToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const token = await authApi.login({ email, password });
    const decoded = decodeToken(token);
    if (!PANEL_ROLES.includes(decoded.role)) {
      throw new Error(
        `Yetkisiz Rol ("${decoded.role || "Bilinmiyor"}"): Bu panel yalnızca Firma ve Admin hesapları içindir.`
      );
    }
    setStoredToken(token);
    setUser(decoded);
    return decoded;
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
