import api from "@/lib/api";
import type { OtpSummary } from "./types";

/** `/admin/otp-requests/`: every OTP SMS sent, read-only. */
export const OTP_REQUESTS = "/admin/otp-requests/";

export const otpKeys = {
  all: ["otp-requests"] as const,
  summary: ["otp-requests", "summary"] as const,
};

export const otpApi = {
  summary: async () => (await api.get<OtpSummary>(`${OTP_REQUESTS}summary/`)).data,
};
