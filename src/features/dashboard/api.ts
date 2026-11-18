import api from "@/lib/api";
import type { DashboardSummary, SmsBalance, TrendRange, Trends } from "./types";

export const dashboardKeys = {
  summary: ["dashboard", "summary"] as const,
  trends: (range: TrendRange) => ["dashboard", "trends", range] as const,
  smsBalance: ["dashboard", "sms-balance"] as const,
};

export const dashboardApi = {
  summary: async () => (await api.get<DashboardSummary>("/admin/dashboard/")).data,
  trends: async (range: TrendRange) => (await api.get<Trends>("/admin/dashboard/trends/", { params: { range } })).data,
  /** Cached on the server for a minute; `refresh` asks BulkSMSBD again. */
  smsBalance: async (refresh = false) =>
    (await api.get<SmsBalance>("/admin/sms-balance/", { params: refresh ? { refresh: 1 } : {} })).data,
};
