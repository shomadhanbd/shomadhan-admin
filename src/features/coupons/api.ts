import api from "@/lib/api";
import type { CouponBody } from "./types";

/** `/admin/coupons/`: flat-amount discount codes students enter at checkout. */
export const COUPONS = "/admin/coupons/";

export const couponKeys = {
  all: ["coupons"] as const,
};

export const couponsApi = {
  create: async (body: CouponBody) => (await api.post(COUPONS, body)).data,
  update: async (id: number, body: Partial<CouponBody>) => (await api.patch(`${COUPONS}${id}/`, body)).data,
};
