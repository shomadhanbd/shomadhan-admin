export type PaymentStatus = "INITIATED" | "VALID" | "FAILED" | "CANCELLED" | "EXPIRED";

/** One SSLCommerz checkout, from initiation to its final status. Amounts are whole taka. */
export interface Payment {
  id: number;
  transaction_id: string;
  user: number | null;
  user_mobile: string | null;
  user_name: string;
  product: number;
  product_title: string;
  coupon_code: string | null;
  original_price: number;
  discount_amount: number;
  amount: number;
  currency: string;
  granted_months: number;
  status: PaymentStatus;
  card_type: string;
  transaction_date: string | null;
  created_at: string;
}

export interface PaymentDetail extends Payment {
  card_issuer_country: string;
  /** SSLCommerz's own record of the payment, as it sent it. */
  gateway_response: Record<string, unknown>;
  subscription: { id: number; starts_at: string; expires_at: string; is_active: boolean } | null;
}

export type AppleStatus = "VERIFIED" | "REFUNDED" | "REVOKED";

/** One verified App Store purchase. */
export interface AppleTransaction {
  id: number;
  user: number;
  user_mobile: string | null;
  user_name: string;
  original_transaction_id: string;
  transaction_id: string;
  apple_product_id: string;
  product: number | null;
  product_title: string | null;
  environment: "Sandbox" | "Production";
  status: AppleStatus;
  purchase_date: string;
  revocation_date: string | null;
  created_at: string;
}

export interface AppleTransactionDetail extends AppleTransaction {
  /** The decoded signed transaction Apple sent. */
  raw_payload: Record<string, unknown>;
}
