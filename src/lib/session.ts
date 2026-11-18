import type { AuthUser } from "@/types/api";

const TOKEN_KEY = "admin_token";
const REFRESH_KEY = "admin_refresh";
const USER_KEY = "admin_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function setAuth(token: string, refresh: string, user: AuthUser): void {
  setTokens(token, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Stores a refreshed pair; the backend rotates the refresh token, so a new one replaces the old. */
export function setTokens(token: string, refresh?: string | null): void {
  localStorage.setItem(TOKEN_KEY, token);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
