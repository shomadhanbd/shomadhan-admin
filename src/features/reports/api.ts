import api from "@/lib/api";
import type { Report, ReportStatus } from "./types";

/** `/admin/reports/`: problems students have flagged on questions. */
export const REPORTS = "/admin/reports/";

export const reportKeys = {
  all: ["reports"] as const,
};

export const reportsApi = {
  setStatus: async (id: number, status: ReportStatus) => (await api.patch<Report>(`${REPORTS}${id}/`, { status })).data,
};
