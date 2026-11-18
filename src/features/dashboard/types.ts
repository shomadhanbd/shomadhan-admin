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
