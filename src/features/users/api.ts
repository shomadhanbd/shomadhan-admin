import api from "@/lib/api";
import type { UserBody, UserDetail } from "./types";

/** `/admin/users/`: every account; students sign up in the app, so there is no create or delete. */
export const USERS = "/admin/users/";

export const userKeys = {
  all: ["users"] as const,
  detail: (id: number) => ["users", "detail", id] as const,
};

export const usersApi = {
  get: async (id: number) => (await api.get<UserDetail>(`${USERS}${id}/`)).data,
  update: async (id: number, body: Partial<UserBody>) => (await api.patch<UserDetail>(`${USERS}${id}/`, body)).data,
};
