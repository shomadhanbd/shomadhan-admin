export type SmsLevel = "ok" | "low" | "empty";

/** The BulkSMSBD credit. When it runs out, students stop getting OTPs. */
export interface SmsBalance {
  /** `false` where SMS is not sent through the gateway (console backend or no API key). */
  available: boolean;
  /** Taka, or `null` when it could not be read. */
  balance: number | null;
  warning_below: number;
  level: SmsLevel | null;
  checked_at: string;
  /** Why the balance is missing, e.g. "This server's IP is not whitelisted at BulkSMSBD". */
  error: string;
}

/** Headline figures. "Today" is Dhaka time; staff accounts are never counted. */
export interface DashboardSummary {
  users: { total: number; onboarded: number; new_today: number; new_this_week: number };
  vip: {
    /** Users with VIP right now. */
    active: number;
    /** Users whose VIP ends within 7 days with nothing running past it. */
    expiring_this_week: number;
  };
  /** Completed SSLCommerz payments plus verified App Store purchases. */
  purchases_today: {
    count: number;
    sslcommerz: number;
    app_store: number;
    /** Taka from SSLCommerz only; App Store purchases carry no price here. */
    amount: number;
  };
}

export type TrendRange = "7d" | "30d" | "3m" | "6m" | "1y";
export type TrendBucket = "day" | "week" | "month";

/** One bar: what happened from `start` (Dhaka time) until the next bucket. */
export interface TrendPoint {
  start: string;
  /** New accounts: the closest thing to a download the backend sees. */
  users: number;
  /** All three sources below. */
  purchases: number;
  sslcommerz: number;
  app_store: number;
  /** VIP granted by an admin. */
  manual: number;
  /** SSLCommerz taka only. */
  amount: number;
}

export interface Trends {
  range: TrendRange;
  bucket: TrendBucket;
  points: TrendPoint[];
}
