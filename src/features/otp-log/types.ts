export type OtpStatus = "not_sent" | "verified" | "pending" | "expired" | "locked";

/** One OTP SMS sent. The code itself is never stored, only its hash, and never shown. */
export interface OtpRequest {
  id: number;
  mobile: string;
  /** The account on this number, if one exists yet. */
  user: number | null;
  user_name: string | null;
  request_ip: string | null;
  status: OtpStatus;
  attempts: number;
  /** Codes entered that did not match. */
  wrong_tries: number;
  max_attempts: number;
  /** BulkSMSBD's verdict; blank on codes sent before it was recorded. */
  sms_status: "accepted" | "failed" | "console" | "";
  sms_response_code: string;
  /** Why the gateway refused it, when it did. */
  sms_error: string;
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
}

export interface OtpSummary {
  sent: number;
  verified: number;
  locked: number;
  /** Codes the gateway refused, e.g. for want of credit. */
  not_sent: number;
  last_failure: { at: string; reason: string } | null;
}
