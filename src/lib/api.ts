import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearAuth, getRefreshToken, getToken, setTokens } from "@/lib/session";
import type { Params } from "@/types/api";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Sign-in endpoints answer 401 for wrong details, which is not an expired session. */
const isAuthCall = (url = "") => url.startsWith("/auth/");

let refreshing: Promise<string | null> | null = null;

/** Trades the refresh token for a new access token; concurrent 401s share one call. */
function refreshToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      // Bare axios: the instance's interceptors must not run on the refresh call itself.
      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh/`,
        { refresh },
      );
      setTokens(data.access, data.refresh);
      return data.access;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

function endSession() {
  clearAuth();
  if (window.location.pathname !== "/login") window.location.href = "/login";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || typeof window === "undefined" || !request || isAuthCall(request.url)) {
      return Promise.reject(error);
    }
    // The access token lives 15 minutes; one silent refresh keeps a working session from landing on /login.
    if (!request.retried) {
      request.retried = true;
      const token = await refreshToken();
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
        return api(request);
      }
    }
    endSession();
    return Promise.reject(error);
  },
);

export default api;

export const cleanParams = (params: Params = {}): Record<string, string | number | boolean> =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")) as Record<
    string,
    string | number | boolean
  >;
