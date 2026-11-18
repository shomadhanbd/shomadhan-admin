import api from "@/lib/api";
import type { SmsBalance } from "./types";

export const dashboardKeys = {
  smsBalance: ["dashboard", "sms-balance"] as const,
};

export const dashboardApi = {
  /** Cached on the server for five minutes; `refresh` asks BulkSMSBD again. */
  smsBalance: async (refresh = false) =>
    (await api.get<SmsBalance>("/admin/sms-balance/", { params: refresh ? { refresh: 1 } : {} })).data,
};
