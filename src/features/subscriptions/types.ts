export type SubscriptionSource = "sslcommerz" | "apple" | "admin";
export type SubscriptionStatus = "active" | "expired" | "revoked";

/** One VIP entitlement: bought through SSLCommerz or the App Store, or granted by an admin. */
export interface Subscription {
  id: number;
  user: number;
  user_mobile: string | null;
  user_name: string;
  product: number;
  product_title: string;
  source: SubscriptionSource;
  /** The SSLCommerz payment behind it, when it was bought that way. */
  payment: number | null;
  apple_transaction: number | null;
  starts_at: string;
  expires_at: string;
  /** `false` once revoked by hand or by a refund. */
  is_active: boolean;
  status: SubscriptionStatus;
  /** The admin who granted it or last changed it by hand. */
  granted_by_name: string | null;
  note: string;
  created_at: string;
}

export interface GrantBody {
  user: number;
  product: number;
  expires_at: string;
  note: string;
}

export type SubscriptionChange = Partial<Pick<Subscription, "expires_at" | "is_active" | "note">>;
