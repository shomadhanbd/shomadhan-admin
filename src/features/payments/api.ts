import api from "@/lib/api";
import type { AppleTransactionDetail, PaymentDetail } from "./types";

/** `/admin/payments/`: SSLCommerz checkouts; read-only, since the gateway owns their state. */
export const PAYMENTS = "/admin/payments/";
/** `/admin/apple-transactions/`: verified App Store purchases; read-only. */
export const APPLE_TRANSACTIONS = "/admin/apple-transactions/";

export const paymentKeys = {
  all: ["payments"] as const,
  apple: ["apple-transactions"] as const,
};

export const paymentsApi = {
  get: async (id: number) => (await api.get<PaymentDetail>(`${PAYMENTS}${id}/`)).data,
  getApple: async (id: number) => (await api.get<AppleTransactionDetail>(`${APPLE_TRANSACTIONS}${id}/`)).data,
};
