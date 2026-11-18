import api from "@/lib/api";
import type { ProductBody } from "./types";

/** `/admin/products/`: the VIP plans students can buy. */
export const PRODUCTS = "/admin/products/";

export const productKeys = {
  all: ["products"] as const,
  /** The plan pickers' cache in `lib/lookups.ts`. */
  lookup: ["lookup", "products"] as const,
};

export const productsApi = {
  create: async (body: ProductBody) => (await api.post(PRODUCTS, body)).data,
  update: async (id: number, body: Partial<ProductBody>) => (await api.patch(`${PRODUCTS}${id}/`, body)).data,
};
