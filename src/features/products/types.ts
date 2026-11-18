/** A plan sold in the app. `sales` counts completed payments. */
export interface Product {
  id: number;
  code: string;
  title: string;
  description: string;
  price: number;
  base_price: number;
  currency: string;
  duration_months: number;
  addon: number | null;
  addon_title: string | null;
  coupon_applicable: boolean;
  is_active: boolean;
  sort_order: number;
  sales: number;
}

export interface ProductBody {
  code: string;
  title: string;
  description: string;
  price: number;
  base_price: number;
  duration_months: number;
  addon: number | null;
  coupon_applicable: boolean;
  is_active: boolean;
  sort_order: number;
}
