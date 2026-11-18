import type { AuthUser } from "@/types/api";

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}
