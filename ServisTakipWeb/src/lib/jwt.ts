import { jwtDecode } from "jwt-decode";
import type { DecodedToken, UserRole } from "@/types";

// ASP.NET Core writes claims using the long-form ClaimTypes URIs by default,
// so we have to look the values up by those keys instead of short names.
const CLAIM_NAMEID =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const CLAIM_EMAIL =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const CLAIM_ROLE =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const CLAIM_COMPANY_ID = "CompanyId";

type RawClaims = Record<string, unknown> & { exp: number };

export function decodeToken(token: string): DecodedToken {
  const raw = jwtDecode<RawClaims>(token);

  return {
    userId: String(raw[CLAIM_NAMEID] ?? ""),
    email: String(raw[CLAIM_EMAIL] ?? ""),
    role: String(raw[CLAIM_ROLE] ?? "") as UserRole,
    companyId: raw[CLAIM_COMPANY_ID] ? String(raw[CLAIM_COMPANY_ID]) : null,
    exp: raw.exp,
  };
}

export function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  return Date.now() >= decoded.exp * 1000;
}
