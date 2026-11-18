"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/api";
import { setAuth, clearAuth } from "@/lib/session";
import type { LoginCredentials } from "@/features/auth/types";

export const NOT_ADMIN = "This account does not have admin access.";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const data = await authApi.login(credentials);
      // The login endpoint is shared with students, so a correct password alone is not enough to get in.
      if (!data.user.is_staff) throw new Error(NOT_ADMIN);
      return data;
    },
    meta: { handlesErrors: true },
    onSuccess: (data) => {
      // Nothing cached for the previous account may reach this one.
      queryClient.clear();
      setAuth(data.access_token, data.refresh_token, data.user);
      router.push("/dashboard");
    },
  });
}

/** The backend has no logout endpoint; signing out is forgetting the tokens. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(() => {
    clearAuth();
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);
}
