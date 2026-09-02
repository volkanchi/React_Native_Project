import { jwtDecode } from "jwt-decode";
import type { DecodedToken, UserRole } from "@/types";

const CLAIM_NAMEID =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const CLAIM_EMAIL =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const CLAIM_ROLE =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const CLAIM_COMPANY_ID = "CompanyId";

type RawClaims = Record<string, unknown> & { exp: number };

const ROLE_MAP: Record<string, UserRole> = {
  "1": "Yolcu",
  "2": "Sofor",
  "3": "Firma",
  "4": "Admin",
  Yolcu: "Yolcu",
  Sofor: "Sofor",
  Şoför: "Sofor",
  Firma: "Firma",
  Admin: "Admin",
};

export function decodeToken(token: unknown): DecodedToken {
  let tokenStr = "";
  if (typeof token === "string") {
    tokenStr = token;
  } else if (token && typeof token === "object") {
    tokenStr =
      (token as any).token ||
      (token as any).accessToken ||
      (token as any).data ||
      "";
  }

  if (!tokenStr || typeof tokenStr !== "string") {
    throw new Error("Geçersiz token: Token metin (string) formatında olmalıdır.");
  }

  const raw = jwtDecode<RawClaims>(tokenStr);

  const rawRole =
    raw[CLAIM_ROLE] ??
    raw["role"] ??
    raw["Role"] ??
    raw["roles"];

  const roleValue = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const roleStr = String(roleValue ?? "").trim();
  const normalizedRole = ROLE_MAP[roleStr] ?? (roleStr as UserRole);

  const email = String(
    raw[CLAIM_EMAIL] ?? raw["email"] ?? raw["Email"] ?? ""
  ).trim();

  const userId = String(
    raw[CLAIM_NAMEID] ??
      raw["nameid"] ??
      raw["sub"] ??
      raw["userId"] ??
      raw["UserId"] ??
      raw["id"] ??
      ""
  ).trim();

  const companyId =
    raw[CLAIM_COMPANY_ID] ?? raw["CompanyId"] ?? raw["companyId"] ?? null;

  return {
    userId,
    email,
    role: normalizedRole,
    companyId: companyId ? String(companyId).trim() : null,
    exp: raw.exp,
  };
}

export function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  return Date.now() >= decoded.exp * 1000;
}