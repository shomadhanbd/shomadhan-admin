import api from "@/lib/api";
import type { AuthResponse, LoginCredentials } from "./types";

/** `/auth/login/`: mobile + password, the same sign-in the student app uses. */
export const LOGIN = "/auth/login/";

export const authApi = {
  login: async (credentials: LoginCredentials) => (await api.post<AuthResponse>(LOGIN, credentials)).data,
};
